package repository

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/goawwer/codinate/internal/adapter/dto/project"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type ProjectRepo interface {
	Create(ctx context.Context, input project.CreateProjectInput) (int, error)
	GetAll(ctx context.Context) ([]project.Row, error)
	Update(ctx context.Context, input project.UpdateProjectInput, id int) error
	RemoveMember(ctx context.Context, projectId int, userId uuid.UUID) error
	AddMember(ctx context.Context, projectId int, userId uuid.UUID) error
	DeleteBy(ctx context.Context, projectId int) error
	DeletePictureBy(ctx context.Context, projectId int) error

	// releases
	GetReleases(ctx context.Context, projectId int) ([]model.Release, error)
	AddNewRelease(ctx context.Context, release *model.Release) error
	UpdateRelease(ctx context.Context, input project.UpdateReleaseInput, id int) error
	DeleteRelease(ctx context.Context, releaseId int) error
}

type projectRepoImpl struct {
	*database.CoreRepository
}

func GetProjectRepo() ProjectRepo {
	r := database.GetCoreRepository()
	return &projectRepoImpl{r}
}

func (r *projectRepoImpl) GetAll(ctx context.Context) ([]project.Row, error) {
	var res []project.Row

	err := r.SelectContext(ctx, &res, `
		SELECT
			p.id,
			author.name AS author_name,
			author.surname AS author_surname,
			p.name, p.description, p.picture_name, p.archived_at, p.created_at, p.updated_at,
			COALESCE(
				json_agg(
					json_build_object(
						'id', 	   mu.id,
						'name',    mu.name,
						'surname', mu.surname
					)
				) FILTER (WHERE mu.id IS NOT NULL),
				'[]'::json
			) AS members
		FROM projects p
		LEFT JOIN users author ON p.author_id = author.id
		LEFT JOIN project_members pm ON pm.project_id = p.id
		LEFT JOIN users mu ON mu.id = pm.user_id
		GROUP BY
			p.id, author.name, author.surname, p.name,
			p.description, p.picture_name,
			p.archived_at, p.created_at, p.updated_at
	`)

	return res, err
}

func (r *projectRepoImpl) Create(ctx context.Context, input project.CreateProjectInput) (int, error) {
	var projectId int64

	err := r.RunInTransaction(ctx, func(tx *sqlx.Tx) error {
		if err := tx.QueryRowContext(ctx, `
            INSERT INTO projects (author_id, name, description, picture_name)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, input.AuthorId, input.Core.Name, input.Core.Description, input.Core.PictureName).
			Scan(&projectId); err != nil {
			return err
		}

		if len(input.MembersIds) > 0 {
			if _, err := tx.ExecContext(ctx, `
                INSERT INTO project_members (project_id, user_id)
                SELECT $1, unnest($2::uuid[])
            `, projectId, pq.Array(input.MembersIds)); err != nil {
				return err
			}
		}

		return nil
	})

	return int(projectId), err
}

func (r *projectRepoImpl) Update(ctx context.Context, input project.UpdateProjectInput, id int) error {
	var qb QueryFiltersBuilder

	clause := qb.Update(util.GetDBColumnsFiltersValuesMap(nil, model.Project{}, &input)).
		Eq("id", id).
		Build()

	_, err := r.ExecContext(ctx, "UPDATE projects "+clause)
	return err
}

func (r *projectRepoImpl) AddMember(ctx context.Context, projectId int, userId uuid.UUID) error {
	_, err := r.ExecContext(ctx,
		`INSERT INTO project_members (project_id, user_id)
		VALUES ($1, $2)`,
		projectId, userId,
	)
	return err
}

func (r *projectRepoImpl) RemoveMember(ctx context.Context, projectId int, userId uuid.UUID) error {
	_, err := r.ExecContext(ctx,
		`DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`,
		projectId, userId,
	)
	return err
}

func (r *projectRepoImpl) DeleteBy(ctx context.Context, projectId int) error {
	return r.RunInTransaction(ctx, func(tx *sqlx.Tx) error {
		if _, err := r.QueryContext(ctx, `
			DELETE FROM project_members
			WHERE project_id = $1
		`, projectId); err != nil {
			return err
		}

		_, err := r.QueryContext(ctx, `
			DELETE FROM projects
			WHERE id = $1
		`, projectId)

		return err
	})
}

func (r *projectRepoImpl) DeletePictureBy(ctx context.Context, projectId int) error {
	_, err := r.QueryContext(ctx, `
		UPDATE projects SET picture_name = NULL
		WHERE id = $1
	`, projectId)

	return err
}

func (r *projectRepoImpl) GetReleases(ctx context.Context, projectId int) ([]model.Release, error) {
	var res []model.Release

	err := r.SelectContext(ctx, &res, `
		SELECT * FROM project_releases
		WHERE project_id = $1
	`, projectId)

	return res, err
}

func (r *projectRepoImpl) AddNewRelease(ctx context.Context, release *model.Release) error {
	_, err := r.NamedQueryContext(ctx, `
		INSERT INTO project_releases (
			project_id, title, decription, status, start_at, end_at
		)
		VALUES (
			:project_id, :title, :description, :status, :start_at, :end_at
		)
	`, release)

	return err
}

func (r *projectRepoImpl) UpdateRelease(ctx context.Context, input project.UpdateReleaseInput, id int) error {
	var qb QueryFiltersBuilder

	clause := qb.Update(util.GetDBColumnsFiltersValuesMap(nil, model.Release{}, &input)).
		Eq("id", id).
		Build()

	_, err := r.ExecContext(ctx, "UPDATE projects "+clause)
	return err
}

func (r *projectRepoImpl) DeleteRelease(ctx context.Context, releaseId int) error {
	_, err := r.Query(`
		DELETE FROM project_releases
		WHERE id = $1
	`, releaseId)

	return err
}
