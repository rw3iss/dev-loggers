export type JsonViewOptions = {
    expandAll?: boolean;
    expandObjs?: Array<string | RegExp>;
    useViewState?: boolean;
};
export declare class JsonView {
    private json;
    private parentContainer;
    private options;
    private viewStates;
    constructor(json: any, parentContainer: HTMLElement, options?: JsonViewOptions);
    private render;
    private toggleExpandNode;
    private drawJsonNode;
    updateJson(newJson: any): void;
}
//# sourceMappingURL=JsonView.d.ts.map