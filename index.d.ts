declare var _default: string;
export default _default;
export interface JsonFormsScope extends angular.IScope {
    data: any;
    schema: any;
    uiSchema: any;
}
export * from './uischema';
export * from './jsonschema';
export { AbstractControl, ControlRendererTester } from './components/renderers/controls/abstract-control';
export { IPathResolver } from './components/services/pathresolver/jsonforms-pathresolver';