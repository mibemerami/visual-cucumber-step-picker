import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {StepDefinitionParser} from './stepDefinitionParser';
const pf = require('./projectFiles');

export class StepsTreeProvider implements vscode.TreeDataProvider<StepItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<StepItem | undefined> = new vscode.EventEmitter<StepItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<StepItem | undefined> = this._onDidChangeTreeData.event;

    constructor(private targetFolder?: string) {
        console.log('StepsTreeProvider constructor has been called with: ', targetFolder );
        
    }

    
    refresh(): void {
        console.log('refresh() has been called');
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        console.log('getTreeItem() has been called');
        return element;
    }

    getChildren(element?: VCSPTreeItem): Thenable<VCSPTreeItem[]> {
        console.log('getChildren() has been called with: ', element);
        if (!this.targetFolder) {
            vscode.window.showInformationMessage('No StepItem in empty workspace');
            return Promise.resolve([]);
        }
        if (element) {
            if (element.contextValue === 'StepsFolder'){
                const targetFolderPath = path.join('', element.itemPath || '');
                if (this.pathExists(targetFolderPath)) {
                    let items: VCSPTreeItem[] = [];
                    this.getSubfoldersAsTreeItems(targetFolderPath).map(item => items.push(item));
                    this.getJSFilesAsTreeItems(targetFolderPath).map(item => items.push(item));
                    return Promise.resolve(items);
                }
            }
            if (element.contextValue === 'StepsFile'){
                const targetFolderPath = path.join('', element.itemPath || '');
                if (this.pathExists(targetFolderPath)) {
                    return Promise.resolve(this.getStepsFromStepFileAsTreeItems(targetFolderPath));
                }
            }
            return Promise.resolve([]); 
        } else {
            const targetFolderPath = path.join('', this.targetFolder);
            if (this.pathExists(targetFolderPath)) {
                let items: VCSPTreeItem[] = [];
                this.getSubfoldersAsTreeItems(targetFolderPath).map(item => items.push(item));
                this.getJSFilesAsTreeItems(targetFolderPath).map(item => items.push(item));
                return Promise.resolve(items);
            } else {
                vscode.window.showInformationMessage('Workspace has no package.json');
                return Promise.resolve([]);
            }
        }

    }

    private getSubfoldersAsTreeItems(targetFolderPath: string): StepFolderItem[]{
        console.log('getSubfoldersAsTreeItems() has been called');
        if (this.pathExists(targetFolderPath)) {
            console.log('path exists: ', targetFolderPath);
            let allFolders = pf.getAllSubfolders(targetFolderPath, []);
            
            return allFolders.map((folder: string) => {
                let foldername = path.basename(folder);
                return new StepFolderItem(foldername, 'click to expand', vscode.TreeItemCollapsibleState.Collapsed, folder);
            });

        } else {
            console.log('path does not exist: ', targetFolderPath);
            return [];
        }
    }

    private getJSFilesAsTreeItems(targetFolderPath: string): StepFileItem[]{
        console.log('getJSFilesAsTreeItems() has been called');
        if (this.pathExists(targetFolderPath)) {
            console.log('path exists: ', targetFolderPath);
            let allFiles = pf.getAllJSFilesInFolder(targetFolderPath);

            return allFiles.map((file: string) => {
                let filename: string = path.basename(file);
                return new StepFileItem(filename, 'click to show steps' + file, vscode.TreeItemCollapsibleState.Collapsed, file);
            });

        } else {
            console.log('path does not exist: ', targetFolderPath);
            return [];
        }
    }

    private getStepsFromStepFileAsTreeItems(targetFilePath: string): StepItem[] {
        if (this.pathExists(targetFilePath)) {
            let stepParser = new StepDefinitionParser;
            let steps = stepParser.getStepRegexpressions(targetFilePath);
            if (steps.length > 0 ) {
                return steps.map(step => new StepItem(step, 'click to add to clipboard', vscode.TreeItemCollapsibleState.None, targetFilePath));
            } else {
                console.log('file is empty: ', targetFilePath);
                vscode.window.showInformationMessage('File is empty: \n'+ targetFilePath);
                return [];
            }
        }else {
            console.log('path does not exist: ', targetFilePath);
            return [];
        }
    }

	/**
	 * Given the path to package.json, read all its dependencies and devDependencies.
	 */
    private getStepsInTargetFolder(targetFolderPath: string): StepItem[] {
        console.log('getStepsInTargetFolder() has been called');
        if (this.pathExists(targetFolderPath)) {
            console.log('path exists: ', targetFolderPath);
            let stepParser = new StepDefinitionParser;
            let allFolders = pf.getAllSubfolders(targetFolderPath, [targetFolderPath]);
            let allFiles: string[]  = [];
            allFolders.map((folder: string) =>
                pf.getAllJSFilesInFolder(folder).map((file: string) => allFiles.push(file))
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

// A super class for the other TreeItem classes, to group them together. Necessary because the method getChildren()
// can only be declared with one subtype of vscode.TreeItem
export class VCSPTreeItem extends vscode.TreeItem {

    constructor(
        public readonly label: string,
        public readonly version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly itemPath?: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        console.log('StepItem constructor has been called.');
    }


    get tooltip(): string {
        console.log('tooltip() has been called');
        return '';
    }

    get description(): string {
        console.log('description() has been called');
        return '';
    }

    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'string.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'string.svg')
    };

    contextValue = 'VCSPTreeItem';

}
export class StepItem extends VCSPTreeItem {

    constructor(
        public readonly label: string,
        public readonly version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly itemPath?: string,
        public readonly command?: vscode.Command
    ) {
        super(label, version, collapsibleState);
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
        light: path.join(__filename, '..', '..', 'resources', 'light', 'string.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'string.svg')
    };

    contextValue = 'cucumberStep';

}

export class StepFileItem extends VCSPTreeItem {

    constructor(
        public readonly label: string,
        public readonly version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly itemPath?: string,
        public readonly command?: vscode.Command
    ) {
        super(label, version, collapsibleState);
        console.log('StepFileItem constructor has been called.');
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
        light: path.join(__filename, '..', '..', 'resources', 'light', 'string.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'string.svg')
    };

    contextValue = 'StepsFile';

}

export class StepFolderItem extends VCSPTreeItem {

    constructor(
        public readonly label: string,
        public readonly version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly itemPath?: string,
        public readonly command?: vscode.Command
    ) {
        super(label, version, collapsibleState);
        console.log('StepFolderItem constructor has been called.');
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
        light: path.join(__filename, '..', '..', 'resources', 'light', 'string.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'string.svg')
    };

    contextValue = 'StepsFolder';

}

