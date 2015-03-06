
declare class WebRule {
    clear(): WebRule;
    deleted(id: string) : WebRule;
    extract(): string;
    isEvaluationType(): boolean;
    getRuleId(): string;
    loadInvalids(data: string): WebRule;
    loadRule(data: string): WebRule;
    loadSettings(data: string): WebRule;
    saved(id: string): WebRule;
    setClientActions(loadRule: Function, deleteRule: Function, saveRule: Function): WebRule;

    dispose(): void;
}

interface ICodeEffects {
    (id: string): WebRule;
}



declare var $ce: ICodeEffects;
declare var $rule: any;
declare var CodeEffects: any;