package repository

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/goawwer/codinate/internal/adapter/dto/team"
	"github.com/goawwer/codinate/internal/adapter/dto/user"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type TeamRepo interface {
	Create(ctx context.Context, input team.CreateTeamInput) error
	GetAllTeamsWithMembersShort(ctx context.Context) ([]team.Row, error)
	GetTeamMembersBy(ctx context.Context, id uuid.UUID) ([]user.TeamMember, error)
	Update(ctx context.Context, input team.UpdateTeamInput, id int) error
	RemoveMember(ctx context.Context, teamId int, userId uuid.UUID) error
	AddMember(ctx context.Context, teamId int, userId uuid.UUID) error
	DeleteBy(ctx context.Context, teamId int) error
	DeletePictureBy(ctx context.Context, teamId int) error
}

type teamRepoImpl struct {
	*database.CoreRepository
}

func GetTeamRepo() TeamRepo {
	r := database.GetCoreRepository()
	return &teamRepoImpl{r}
}

func (r *teamRepoImpl) GetAllTeamsWithMembersShort(ctx context.Context) ([]team.Row, error) {
	res := make([]team.Row, 0)

	err := r.SelectContext(ctx, &res, `
		SELECT
			t.*,
			COALESCE(
				json_agg(
					json_build_object(
						'id',      u.id,
						'name',    u.name,
						'surname', u.surname,
						'role',    er.name
					)
				) FILTER (WHERE u.id IS NOT NULL),
				'[]'::json
			) AS members
		FROM teams t
		LEFT JOIN team_members m ON t.id = m.team_id
		LEFT JOIN users u ON u.id = m.user_id
		LEFT JOIN employee_roles er ON u.role_id = er.id
		GROUP BY t.id
	`)

	return res, err
}

func (r *teamRepoImpl) GetTeamMembersBy(ctx context.Context, id uuid.UUID) ([]user.TeamMember, error) {
	res := make([]user.TeamMember, 0)

	err := r.SelectContext(ctx, &res, `
		SELECT
			u.name, u.surname, u.username, u.picture_name,
		FROM teams t
		LEFT JOIN team_members m ON t.id = m.team_id
		LEFT JOIN users u ON u.id = m.user_id
		LEFT JOIN employee_roles er ON er.id = u.role_id
		WHERE t.id = $1
	`, id)

	return res, err
}

func (r *teamRepoImpl) Create(ctx context.Context, input team.CreateTeamInput) error {
	return r.RunInTransaction(ctx, func(tx *sqlx.Tx) error {
		var teamId int64

		if err := tx.QueryRowContext(ctx, `
            INSERT INTO teams (author_id, name, description, picture_name)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, input.AuthorId, input.Name, input.Description, input.PictureName).
			Scan(&teamId); err != nil {
			return err
		}

		if len(input.MembersIds) > 0 {
			if _, err := tx.ExecContext(ctx, `
                INSERT INTO team_members (team_id, user_id)
                SELECT $1, unnest($2::uuid[])
            `, teamId, pq.Array(input.MembersIds)); err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *teamRepoImpl) Update(ctx context.Context, input team.UpdateTeamInput, id int) error {
	var qb QueryFiltersBuilder

	clause := qb.Update(util.GetDBColumnsFiltersValuesMap(nil, model.Team{}, &input)).
		Eq("id", id).
		Build()

	_, err := r.ExecContext(ctx, "UPDATE projects "+clause, qb.Args()...)
	return err
}

func (r *teamRepoImpl) AddMember(ctx context.Context, teamId int, userId uuid.UUID) error {
	_, err := r.ExecContext(ctx, `
		INSERT INTO team_members (team_id, user_id)
		VALUES ($1, $2)
		`,
		teamId, userId,
	)
	return err
}

func (r *teamRepoImpl) RemoveMember(ctx context.Context, teamId int, userId uuid.UUID) error {
	_, err := r.ExecContext(ctx,
		`DELETE FROM team_members WHERE team_id = $1 AND user_id = $2`,
		teamId, userId,
	)
	return err
}

func (r *teamRepoImpl) DeleteBy(ctx context.Context, teamId int) error {
	return r.RunInTransaction(ctx, func(tx *sqlx.Tx) error {
		if _, err := r.QueryContext(ctx, `
			DELETE FROM team_members
			WHERE team_id = $1
		`, teamId); err != nil {
			return err
		}

		_, err := r.QueryContext(ctx, `
			DELETE FROM teams
			WHERE id = $1
		`, teamId)

		return err
	})
}

func (r *teamRepoImpl) DeletePictureBy(ctx context.Context, teamId int) error {
	_, err := r.QueryContext(ctx, `
		UPDATE teams SET picture_name = NULL
		WHERE id = $1
	`, teamId)

	return err
}
