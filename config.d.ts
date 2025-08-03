export declare const configSchematics: import("@lmstudio/sdk").ConfigSchematics<{
    workspaceFolder: {
        key: "workspaceFolder";
        type: string;
        valueTypeKey: "string";
    };
} & {
    maxFileSize: {
        key: "maxFileSize";
        type: number;
        valueTypeKey: "numeric";
    };
} & {
    enableWebSearch: {
        key: "enableWebSearch";
        type: boolean;
        valueTypeKey: "boolean";
    };
} & {
    braveApiKey: {
        key: "braveApiKey";
        type: string;
        valueTypeKey: "string";
    };
} & {
    operationMode: {
        key: "operationMode";
        type: boolean;
        valueTypeKey: "boolean";
    };
}>;
export declare const globalConfigSchematics: import("@lmstudio/sdk").ConfigSchematics<{
    defaultTimeout: {
        key: "defaultTimeout";
        type: number;
        valueTypeKey: "numeric";
    };
}>;
//# sourceMappingURL=config.d.ts.map