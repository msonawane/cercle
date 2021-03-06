defmodule CercleApi.APIV2.BoardController do

  require Logger
  use CercleApi.Web, :controller
  alias CercleApi.{ Board, Card, BoardColumn, Company }

  plug CercleApi.Plug.EnsureAuthenticated
  plug CercleApi.Plug.CurrentUser
  plug :scrub_params, "board" when action in [:create, :update]
  plug :authorize_resource, model: Board, only: [:update, :delete],
  unauthorized_handler: {CercleApi.Helpers, :handle_json_unauthorized},
  not_found_handler: {CercleApi.Helpers, :handle_json_not_found}

  def index(conn, _params) do
    current_user = CercleApi.Plug.current_user(conn)
    company = current_company(conn)

    query = from p in Board,
      where: p.company_id == ^company.id,
      order_by: [desc: p.updated_at],
      preload: [:board_columns]

    boards = Repo.all(query)
    render(conn, "index.json", boards: boards)
  end

  def show(conn, %{"id" => id}) do
    current_user = CercleApi.Plug.current_user(conn)
    company = current_company(conn)
    board_query = from(p in Board,
      where: p.company_id == ^company.id,
      where: p.id == ^id,
      order_by: [desc: p.updated_at]
    )
    board = board_query
    |> Board.preload_full_data
    |> Repo.one
    render(conn, "full_show.json", board: board)
  end

  def create(conn, %{"board" => board_params}) do
    user = CercleApi.Plug.current_user(conn)
    company = current_company(conn)

    changeset = company
      |> Ecto.build_assoc(:boards)
      |> Board.changeset(board_params)

    case Repo.insert(changeset) do
      {:ok, board} ->
        steps = ["Step 1", "Step 2", "Step 3"]
        Enum.each [0, 1, 2], fn (index) ->
          boardcol_params = %{:board_id => board.id, :order => index, :name => Enum.at(steps, index)}
          changeset = BoardColumn.changeset(%BoardColumn{}, boardcol_params)
          CercleApi.Repo.insert!(changeset)
        end

        conn
        |> put_status(:created)
        |> render("show.json", board: Repo.preload(board, [:board_columns]))
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(CercleApi.ChangesetView, "error.json", changeset: changeset)
    end
  end

  def update(conn, %{"id" => id, "board" => board_params}) do
    board = Repo.get!(Board, id)
    changeset = Board.changeset(board, board_params)
    case Repo.update(changeset) do
      {:ok, board} ->
        board = board
        |> Repo.preload([board_columns: Board.preload_query])

        CercleApi.BoardNotificationService.update_notification(board)
        render(conn, "show.json", board: board)
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(CercleApi.ChangesetView, "error.json", changeset: changeset)
    end
  end

  def reorder_columns(conn, %{"board_id" => board_id, "order_column_ids" => order_ids}) do
    order_ids
    |> Enum.with_index
    |> Enum.each(fn({x, i}) ->
      changeset = BoardColumn.changeset(%BoardColumn{id: x, board_id: board_id}, %{order: i})
      Repo.update(changeset)
    end)
    board = Board
    |> Repo.get(board_id)
    |> Repo.preload([board_columns: Board.preload_query])
    CercleApi.BoardNotificationService.update_notification(board)
    render(conn, "show.json", board: Repo.preload(board, [:board_columns]))
  end

  def delete(_conn, %{"id" => _id}) do
  end

  def archive(conn, %{"board_id" => id}) do
    board = Repo.get!(Board, id)
    changeset = Board.changeset(board, %{archived: true})
    case Repo.update(changeset) do
      {:ok, _} ->
        json conn, %{status: 200}
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(CercleApi.ChangesetView, "error.json", changeset: changeset)
    end
  end

  def unarchive(conn, %{"board_id" => id}) do
    board = Repo.get!(Board, id)
    changeset = Board.changeset(board, %{archived: false})
    case Repo.update(changeset) do
      {:ok, _} ->
        json conn, %{status: 200}
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(CercleApi.ChangesetView, "error.json", changeset: changeset)
    end
  end

end
