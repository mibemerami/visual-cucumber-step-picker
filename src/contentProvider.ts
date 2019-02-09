import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {StepDefinitionParser} from './stepDefinitionParser';

export class DepNodeProvider implements vscode.TreeDataProvider<StepItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<StepItem | undefined> = new vscode.EventEmitter<StepItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<StepItem | undefined> = this._onDidChangeTreeData.event;

    constructor(private targetFolder: string) {
        console.log('DepNodeProvider constructor has been called with: ', targetFolder );
    }

    refresh(): void {
        console.log('refresh() has been called');
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: StepItem): vscode.TreeItem {
        console.log('getTreeItem() has been called');
        return element;
    }

    getChildren(element?: StepItem): Thenable<StepItem[]> {
        console.log('getChildren() has been called with: ', element);
        if (!this.targetFolder) {
            vscode.window.showInformationMessage('No StepItem in empty workspace');
            return Promise.resolve([]);
        }
        if (element) {
            return Promise.resolve([]); // Because for the step picker, we don't want a subtree
        } else {
            const targetFolderPath = path.join('', this.targetFolder);
            if (this.pathExists(targetFolderPath)) {
                return Promise.resolve(this.getStepsInTargetFolder(targetFolderPath));
            } else {
                vscode.window.showInformationMessage('Workspace has no package.json');
                return Promise.resolve([]);
            }
        }

    }

    private getAllSubfolders (folder: string, array: string[]): string[] {
        console.log('getAllSubfolders() has been called')
        fs.readdirSync(folder).filter(item => fs.statSync(path.join(folder, item)).isDirectory())
            .map(subfolder => path.join(folder, subfolder)).map(subfolder => {
                if (!array.includes(subfolder)) {
                    array.push(subfolder);
                    this.getAllSubfolders(subfolder, array);
                }
            });
        return array;
    }
    private getAllJSFilesInFolder (folder: string): string[] {
        console.log('getAllJSFilesInFolder() has been called')
        return fs
            .readdirSync(folder)
            .filter(item => fs.statSync(path.join(folder, item)).isFile())
            .filter(file => file.match(/.+\.js$/) !== null)
            .map(file => path.join(folder, file));
    }

	/**
	 * Given the path to package.json, read all its dependencies and devDependencies.
	 */
    private getStepsInTargetFolder(targetFolderPath: string): StepItem[] {
        console.log('getStepsInTargetFolder() has been called')
        if (this.pathExists(targetFolderPath)) {
            console.log('path exists: ', targetFolderPath);
            let stepParser = new StepDefinitionParser;
            let allFolders = this.getAllSubfolders(targetFolderPath, [targetFolderPath]);
            let allFiles: string[]  = [];
            allFolders.map(folder =>
                this.getAllJSFilesInFolder(folder).map(file => allFiles.push(file))
            );
            console.log('All files: ', allFiles);
            let allSteps: string[] = [];
            allFiles.map(file => stepParser.getStepRegexpressions(file)).map(stepArray => stepArray.map(step => allSteps.push(step)));
            console.log('All steps: ', allSteps);
            return allSteps.map(step => new StepItem(step, 'step, regex: ' + step, vscode.TreeItemCollapsibleState.Collapsed));
         
        } else {
            console.log('path does not exist: ', targetFolderPath);
            return [];
        }
    }

    private pathExists(p: string): boolean {
        console.log('pathExists() has been called');
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }

        return true;
    }
}

export class StepItem extends vscode.TreeItem {

    constructor(
        public readonly label: string,
        private version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        console.log('StepItem constructor has been called.');
    }

    get tooltip(): string {
        console.log('tooltip() has been called');
        return `${this.label}-${this.version}`;
    }

    get description(): string {
        console.log('description() has been called');
        return this.version;
    }

    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };

    contextValue = 'dependency';

}