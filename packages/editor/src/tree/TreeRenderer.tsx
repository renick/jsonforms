// tslint:disable:jsx-no-multiline-js
// tslint:disable:max-line-length
import * as _ from 'lodash';
import * as React from 'react';
import {
  Actions,
  ControlProps,
  ControlState,
  generateDefaultUISchema,
  getData,
  JsonSchema4,
  Paths,
  Resolve,
  Runtime,
  UISchemaElement,
} from '@jsonforms/core';
import {
  Control,
  JsonForms
} from '@jsonforms/react';
import { connect } from 'react-redux';
import ObjectListItem from './ObjectListItem';
import ExpandRootArray from './ExpandRootArray';
import EditorDialog from './EditorDialog';
import HTML5Backend from 'react-dnd-html5-backend';
// import TouchBackend from 'react-dnd-touch-backend';
import { DragDropContext } from 'react-dnd';
import { MasterDetailLayout } from '../master-detail-layout';
import { getUiSchemata } from '../reducers';

export interface MasterProps {
  schema: JsonSchema4;
  path: string;
  rootData: any;
  selection: any;
  // TODO: unify types
  handlers: {
    onAdd: any;
    onRemove?: any;
    onSelect: any;
    resetSelection: any;
  };
  uischema: UISchemaElement;
  filterPredicate: any;
  labelProvider: any;
  imageProvider: any;
}

const Master = (
  {
    schema,
    path,
    selection,
    handlers,
    uischema,
    rootData,
    filterPredicate,
    labelProvider,
    imageProvider
  }: MasterProps) => {
  if (schema.items !== undefined) {
    return (
      <ul>
        <ExpandRootArray
          rootData={rootData}
          schema={schema.items}
          path={path}
          selection={selection}
          handlers={handlers}
          uischema={uischema}
          filterPredicate={filterPredicate}
          labelProvider={labelProvider}
          imageProvider={imageProvider}
        />
      </ul>
    );
  }

  return (
    <ul>
      <ObjectListItem
        path={path}
        schema={schema}
        uischema={uischema}
        selection={selection}
        handlers={handlers}
        isRoot={true}
        filterPredicate={filterPredicate}
        labelProvider={labelProvider}
        imageProvider={imageProvider}
      />
    </ul>
  );
};

const isNotTuple = (schema: JsonSchema4) => !Array.isArray(schema.items);

export interface TreeMasterDetailState extends ControlState {
  selected: {
    schema: JsonSchema4,
    data: any,
    path: string
  };
  dialog: {
    open: boolean,
    schema: JsonSchema4,
    path: string
  };
}

export interface TreeProps extends ControlProps {
  resolvedSchema: any;
  rootData: any;
  resolvedRootData: any;
  addToRoot: any;
  uiSchemata?;
  filterPredicate: any;
  labelProvider: any;
  imageProvider: any;
}

export class TreeMasterDetail extends Control<TreeProps, TreeMasterDetailState> {

  componentWillMount() {
    const { uischema, resolvedRootData, resolvedSchema } = this.props;
    const controlElement = uischema as MasterDetailLayout;
    this.setState({
      dialog: {
        open: false,
        schema: undefined,
        path: undefined
      }
    });

    const path = Paths.fromScopable(controlElement);
    if (_.isArray(resolvedRootData)) {
      this.setState({
        selected: {
          schema: resolvedSchema.items,
          data: resolvedRootData[0],
          path: Paths.compose(path, '0')
        }
      });
    } else {
      this.setState({
        selected: {
          schema: resolvedSchema,
          data: resolvedRootData,
          path: path
        }
      });
    }
  }

  setSelection = (schema, data, path) => () => {
    this.setState({
      selected: {
        schema,
        data,
        path
      }
    });
  }

  openDialog = (schema, path) => () => {
    this.setState({
      dialog: {
        open: true,
        schema,
        path
      }
    });
  }

  closeDialog = () => {
    this.setState({
      dialog: {
        open: false,
        schema: undefined,
        path: undefined
      }
    });
  }

  render() {
    const { uischema, schema, resolvedSchema, visible, path, resolvedRootData, rootData, addToRoot,
            uiSchemata, filterPredicate, labelProvider, imageProvider } = this.props;
    const controlElement = uischema as MasterDetailLayout;
    const dialogProps = {
      open: this.state.dialog.open
    };

    let resetSelection;
    if (resolvedSchema.items !== undefined) {
      resetSelection = this.setSelection(resolvedSchema.items, resolvedRootData[0], Paths.compose(path, '0'));
    } else {
      resetSelection = this.setSelection(resolvedSchema, resolvedRootData, path);
    }
    const handlers = {
      onSelect: this.setSelection,
      onAdd: this.openDialog,
      resetSelection: resetSelection
    };

    let detailSchema;
    if (this.state.selected && this.state.selected.schema && this.state.selected.schema.id) {
      const uiSchema = uiSchemata[this.state.selected.schema.id];
      detailSchema = uiSchema ? uiSchema : generateDefaultUISchema(this.state.selected.schema);
    }

    return (
      <div hidden={!visible} className={'jsf-treeMasterDetail'}>
        <div className={'jsf-treeMasterDetail-header'}>
          <label>
            {typeof controlElement.label === 'string' ? controlElement.label : ''}
          </label>
          {
            Array.isArray(resolvedRootData) &&
            <button
              className='jsf-treeMasterDetail-add'
              onClick={addToRoot(schema, path)}
            >
              Add to root
            </button>
          }
        </div>
        <div className='jsf-treeMasterDetail-content'>
          <div className='jsf-treeMasterDetail-master'>
            <Master
              uischema={uischema}
              schema={resolvedSchema}
              path={path}
              handlers={handlers}
              selection={this.state.selected.data}
              rootData={rootData}
              filterPredicate={filterPredicate}
              labelProvider={labelProvider}
              imageProvider={imageProvider}
            />
          </div>
          <div className='jsf-treeMasterDetail-detail'>
            {
              this.state.selected ?
                <JsonForms
                  schema={this.state.selected.schema}
                  path={this.state.selected.path}
                  uischema={detailSchema}
                /> : 'Select an item'
            }
          </div>
        </div>
        <div>
          {
            this.state.dialog.open &&
              <EditorDialog
                path={this.state.dialog.path}
                schema={this.state.dialog.schema}
                closeDialog={this.closeDialog}
                dialogProps={dialogProps}
                setSelection={this.setSelection}
              />
          }
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const path = Paths.compose(ownProps.path, Paths.fromScopable(ownProps.uischema));
  const visible = _.has(ownProps, 'visible') ? ownProps.visible :  Runtime.isVisible(ownProps, state);
  const enabled = _.has(ownProps, 'enabled') ? ownProps.enabled :  Runtime.isEnabled(ownProps, state);
  const rootData = getData(state);
  const uiSchemata = getUiSchemata(state);

  return {
    rootData: getData(state),
    resolvedRootData: Resolve.data(rootData, path),
    uischema: ownProps.uischema,
    schema: ownProps.schema,
    resolvedSchema: Resolve.schema(ownProps.schema, ownProps.uischema.scope),
    path,
    visible,
    enabled,
    uiSchemata,
    filterPredicate: ownProps.filterPredicate,
    labelProvider: ownProps.labelProvider,
    imageProvider: ownProps.imageProvider
  };
};

const mapDispatchToProps = dispatch => ({
  addToRoot(schema, path) {
    return () => {
      if (isNotTuple(schema)) {
        dispatch(
          Actions.update(
            path,
            data => {
              const clone = data.slice();
              clone.push({});

              return clone;
            }
          )
        );
      }
    };
  }
});

const DnDTreeMasterDetail =
  DragDropContext(HTML5Backend)(TreeMasterDetail);

export const TreeRenderer = connect(
    mapStateToProps,
    mapDispatchToProps
  )(DnDTreeMasterDetail);
export default TreeRenderer;
