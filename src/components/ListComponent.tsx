import * as React from 'react';
import CardComponent from './CardComponent';
import { useQuery, gql } from '@apollo/client';
import TodoInputComponent from './TodoInputComponent';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export type Todo = {
  title: string;
  description?: string;
  tags: Array<string>;
  priority: number;
  id: string;
  status: string;
  image?: CedalioFile;
};

export type CedalioFile = {
  contentType: string;
  cid: string;
  size: number;
  fileName: string;
  fileURL: string;
};

type Update = {
  todoId: string;
  update: string;
};

const GET_TODOS = gql`
  query GetTodos {
    todoCollection(first: 10) {
      edges {
        node {
          id
          title
          description
          priority
          tags
          status
          image {
            contentType
            cid
            size
            fileName
            fileURL
          }
        }
      }
    }
  }
`;

const dragColors = {
  initialColor: '#63636324',
  dragStartColor: '#636363',
  doneColor: '#6ab05a',
  deleteColor: '#ea3b3b'
};

export default function ListComponent() {
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [newTodo, setNewTodo] = React.useState<Todo>();
  const [update, setUpdate] = React.useState<Update>();
  const [open, setOpen] = React.useState(false);
  const [updateMessage, setUpdateMessage] = React.useState('');
  const [updateError, setUpdateError] = React.useState(false);
  const [doneIconColor, setDoneIconColor] = React.useState(dragColors.initialColor);
  const [deleteIconColor, setDeleteIconColor] = React.useState(dragColors.initialColor);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      setUpdateError(false);
      setOpen(false);
      return;
    }
    setOpen(false);
  };

  function onUpdateTodo(todoId: string, status: string) {
    setUpdateError(false);
    setUpdateMessage(`The ${status} operation was successfully updated in polygon-mumbai`);
    setOpen(true);
    setTodos((current: any) => current.filter((todo: any) => todo.id !== todoId));
  }

  function onError() {
    setUpdateError(true);
    setUpdateMessage('There was an unexpected error');
    setOpen(true);
  }

  const defaultTodo = {
    title: 'Create your first To Do :D',
    description: 'Please create your first To Do item, this place holder will disappear after that',
    tags: ['market', 'rutine'],
    priority: 1,
    id: 'abcdefg12345',
    status: 'READY'
  };

  const { loading, error, data } = useQuery(GET_TODOS);

  React.useEffect(() => {
    if (data) {
      const extractedTodos = data.todoCollection.edges.map((edge: any) => edge.node);
      setTodos(extractedTodos);
    } else {
      setTodos([]);
    }
  }, [data]);

  React.useEffect(() => {
    if (newTodo) {
      setTodos((n) => [...n, newTodo]);
    }
  }, [newTodo]);

  if (loading) return <></>;
  if (error) {
    return <p>Error : {error.message}</p>;
  }

  const displayTodos = () => {
    const displayableTodos = todos.filter((todo) => todo.status === 'READY');
    if (displayableTodos.length === 0) {
      return (
        <CardComponent
          key="default"
          todo={defaultTodo}
          setState={setTodos}
          index={1}
          updateState={update}
          onUpdateTodo={onUpdateTodo}
          default={true}
          onError={onError}
        />
      );
    } else {
      return displayableTodos.map((todo: Todo, index) => (
        <CardComponent
          key={todo.id}
          todo={todo}
          setState={setTodos}
          index={index}
          updateState={update}
          onUpdateTodo={onUpdateTodo}
          default={false}
          onError={onError}
        />
      ));
    }
  };

  function onDragEnd(result: any) {
    setDeleteIconColor(dragColors.initialColor);
    setDoneIconColor(dragColors.initialColor);
    setUpdate({ update: result.destination.droppableId, todoId: result.draggableId });
  }

  function onDragStart(result: any) {
    setDeleteIconColor(dragColors.dragStartColor);
    setDoneIconColor(dragColors.dragStartColor);
  }
  function onDragUpdate(result: any) {
    if (result.destination.droppableId === 'delete') {
      setDeleteIconColor(dragColors.deleteColor);
    } else if (result.destination.droppableId === 'done') {
      setDoneIconColor(dragColors.doneColor);
    } else {
      setDeleteIconColor(dragColors.dragStartColor);
      setDoneIconColor(dragColors.dragStartColor);
    }
  }

  return (
    <div className="list">
      <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart} onDragUpdate={onDragUpdate}>
        <div className="container">
          <Droppable droppableId="delete">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="delete-container">
                <DeleteOutlineOutlinedIcon
                  fontSize="large"
                  sx={{
                    height: '200px',
                    width: '200px',
                    color: deleteIconColor,
                    position: 'fixed',
                    right: '76%'
                  }}
                />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <Droppable droppableId="ready">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="list-container">
                {displayTodos()}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <Droppable droppableId="done">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="done-container">
                <CheckCircleOutlineIcon
                  fontSize="large"
                  sx={{
                    height: '200px',
                    width: '200px',
                    color: doneIconColor,
                    position: 'fixed',
                    left: '76%'
                  }}
                />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
        <TodoInputComponent setState={setNewTodo} />
        <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
          <Alert onClose={handleClose} severity={updateError ? 'error' : 'success'} sx={{ width: '100%' }}>
            {updateMessage}
          </Alert>
        </Snackbar>
      </DragDropContext>
    </div>
  );
}
