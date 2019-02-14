const fs = require('fs');
const ts = require('typescript');
const path = require('path');

interface Step {
    funcName: string; 
    regex: string;
}
export class StepDefinitionParser {
    constructor(public filePath?: string){
        if (typeof filePath !== 'undefined'){    
            if (!fs.statSync(path.join('', filePath)).isFile()){
                console.warn('WARN: File does not exist.', filePath);
            }
        }
    }
    public cucumberStepKeywords: string[] = ['Given', 'When', 'Then', 'And', 'But'];
    public setFilePath(newPath: string): void {
        this.filePath = newPath;
    }
    public getSteps(file?: string): Step[] {
        file = file || this.filePath;
        let sourceCode: string = fs.readFileSync(file, { encoding: 'UTF-8' });
        let tsSourceFile: any = ts.createSourceFile(__filename, sourceCode, ts.ScriptTarget.Latest);
        let stepDefinitions: Step[] = [];
        for (let statement of tsSourceFile.statements) {
            let funcName: string = statement && statement.expression && statement.expression.expression 
                && statement.expression.expression.escapedText;
            let regex: string = statement && statement.expression && statement.expression.arguments[0] 
                && statement.expression.arguments[0].text;
            if (typeof (funcName) !== 'undefined' || typeof (funcName) !== 'undefined'){
                if (this.cucumberStepKeywords.includes(funcName)){
                    stepDefinitions.push({ funcName, regex });
                }
            }
        }
        console.log('getSteps found: ', stepDefinitions);
        return stepDefinitions;
    }
    public getStepRegexpressions(file?: string): string[] {
        file = file || this.filePath;
        return this.getSteps(file).map(step => step.regex);

    }
}


