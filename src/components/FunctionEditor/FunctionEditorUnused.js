import React, { useState } from 'react';
import {
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  Typography,
  Paper,
  ThemeProvider,
  createTheme,
  Box,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SwapVertIcon from '@mui/icons-material/SwapVert';

import Modal from '@mui/material/Modal';
import * as recast from 'recast';

const FUNCTION_TYPES = [
  'functionExpression',
  'functionDeclaration',
  'arrowFunctionExpression',
];

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
};

const parseSpreadParam = (param) => {
  if (param.startsWith('{') && param.endsWith('}')) {
    return param
      .slice(1, -1)
      .split(',')
      .map((p) => p.trim());
  }
  return null;
};

export const FunctionEditor = ({ initialFuncInfo, open, onClose }) => {
  const parsedParams = initialFuncInfo.node.params.map((param) => {
    return recast.print(param, { reuseWhitespace: true }).code;
  });
  const [funcInfo, setFuncInfo] = useState({
    ...initialFuncInfo,
    parameters: parsedParams,
  });

  const handleClose = () => {
    onClose(funcInfo);
  };

  const handleFunctionNameChange = (e) => {
    setFuncInfo({ ...funcInfo, name: e.target.value });
  };

  const handleFunctionTypeChange = (e) => {
    setFuncInfo({ ...funcInfo, type: e.target.value });
  };

  const addParameter = () => {
    setFuncInfo({ ...funcInfo, parameters: [...funcInfo.parameters, ''] });
  };

  const addSpreadParameter = () => {
    setFuncInfo({
      ...funcInfo,
      parameters: [...funcInfo.parameters, '{ newSpreadParam }'],
    });
  };

  const addNestedParameter = (index) => {
    const updatedParameters = [...funcInfo.parameters];
    const spreadParams = parseSpreadParam(updatedParameters[index]);
    if (spreadParams) {
      spreadParams.push('newParam');
      updatedParameters[index] = `{ ${spreadParams.join(', ')} }`;
      setFuncInfo({ ...funcInfo, parameters: updatedParameters });
    }
  };

  const deleteParameter = (index) => {
    const newParameters = [...funcInfo.parameters];
    newParameters.splice(index, 1);
    setFuncInfo({ ...funcInfo, parameters: newParameters });
  };

  const deleteNestedParameter = (spreadIndex, nestedIndex) => {
    const updatedParameters = [...funcInfo.parameters];
    const spreadParams = parseSpreadParam(updatedParameters[spreadIndex]);
    if (spreadParams) {
      spreadParams.splice(nestedIndex, 1); // Remove the specific spread parameter
      updatedParameters[spreadIndex] = `{ ${spreadParams.join(', ')} }`;
      setFuncInfo({ ...funcInfo, parameters: updatedParameters });
    }
  };

  const handleParameterChange = (index, newValue) => {
    const newParameters = [...funcInfo.parameters];
    newParameters[index] = newValue;
    setFuncInfo({ ...funcInfo, parameters: newParameters });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newParameters = Array.from(funcInfo.parameters);
    const [moved] = newParameters.splice(result.source.index, 1);
    newParameters.splice(result.destination.index, 0, moved);
    setFuncInfo({ ...funcInfo, parameters: newParameters });
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Paper style={{ padding: '16px', maxWidth: '600px', margin: 'auto' }}>
            <Typography variant="h6">Function Editor</Typography>

            <TextField
              label="Function Name"
              value={funcInfo.name}
              onChange={handleFunctionNameChange}
              fullWidth
            />

            <Select
              value={funcInfo.type}
              onChange={handleFunctionTypeChange}
              fullWidth
            >
              {FUNCTION_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>

            <Typography variant="subtitle1">Parameters:</Typography>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="parameters">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {funcInfo.parameters.map((parameter, index) => {
                      const spreadParams = parseSpreadParam(parameter);
                      return (
                        <Draggable
                          key={index}
                          draggableId={index.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                marginBottom: '8px',
                                backgroundColor: '#333',
                                padding: '8px',
                                borderRadius: '4px',
                              }}
                            >
                              {spreadParams ? (
                                <Box>
                                  <Typography
                                    variant="subtitle2"
                                    style={{ color: '#90caf9' }}
                                  >
                                    Spread Parameters:
                                  </Typography>
                                  {spreadParams.map((spreadParam, i) => (
                                    <Box
                                      key={i}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '4px',
                                      }}
                                    >
                                      <TextField
                                        label={`Spread ${i + 1}`}
                                        value={spreadParam}
                                        onChange={(e) => {
                                          const updatedParams = [
                                            ...spreadParams,
                                          ];
                                          updatedParams[i] = e.target.value;
                                          handleParameterChange(
                                            index,
                                            `{ ${updatedParams.join(', ')} }`
                                          );
                                        }}
                                        variant="outlined"
                                        size="small"
                                        style={{
                                          flexGrow: 1,
                                          marginRight: '8px',
                                        }}
                                      />
                                      <IconButton
                                        onClick={() =>
                                          deleteNestedParameter(index, i)
                                        }
                                        size="small"
                                        color="secondary"
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  ))}
                                  <Button
                                    onClick={() => addNestedParameter(index)}
                                    color="primary"
                                    size="small"
                                  >
                                    Add Nested Parameter
                                  </Button>
                                </Box>
                              ) : (
                                <Box
                                  sx={{ display: 'flex', alignItems: 'center' }}
                                >
                                  <TextField
                                    label={`Parameter ${index + 1}`}
                                    value={parameter}
                                    onChange={(e) =>
                                      handleParameterChange(
                                        index,
                                        e.target.value
                                      )
                                    }
                                    variant="outlined"
                                    size="small"
                                    style={{ flexGrow: 1, marginRight: '8px' }}
                                  />
                                  <IconButton
                                    onClick={() => deleteParameter(index)}
                                    size="small"
                                    color="secondary"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                  <SwapVertIcon
                                    fontSize="small"
                                    color="disabled"
                                  />
                                </Box>
                              )}
                            </Box>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <Button
              startIcon={<AddIcon />}
              variant="contained"
              color="primary"
              onClick={addParameter}
              style={{ marginTop: '8px', marginRight: '8px' }}
            >
              Add Parameter
            </Button>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              color="secondary"
              onClick={addSpreadParameter}
              style={{ marginTop: '8px' }}
            >
              Add Spread Parameter
            </Button>
          </Paper>
        </Box>
      </Modal>
    </ThemeProvider>
  );
};
