import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {StepDefinitionParser, StepDefinitionParserJS} from './stepDefinitionParser';
const pf = require('./projectFiles');

export class StepsTreeProvider implements vscode.TreeDataProvider<StepItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<StepItem | undefined> = new vscode.EventEmitter<StepItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<StepItem | undefined> = this._onDidChangeTreeData.event;
    private _selectedTreeItem: vscode.TreeItem|undefined;
    constructor(private targetFolder?: string, private searchFilter?: RegExp) {
        // if (typeof searchFilter === undefined) {
        //     this.searchFilter = /.*/;
        // }
        console.log('StepsTreeProvider constructor has been called with: ', targetFolder );
        
    }

    public setSearchFilter(filter: RegExp): void {
        this.searchFilter = filter;
    }

    public getSearchFilter(): RegExp|undefined {
        return this.searchFilter;
    }

    public setTargetFolder(folder: string){
        this.targetFolder = folder;
    }

    public setSelectedTreeItem(item: vscode.TreeItem ): void {
        this._selectedTreeItem = item;
    }
    
    public getSelectedTreeItem(): vscode.TreeItem | undefined {
        return this._selectedTreeItem;
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
                vscode.window.showInformationMessage('Path not found: ', targetFolderPath );
                return Promise.resolve([]);
            }
        }

    }

    private getSubfoldersAsTreeItems(targetFolderPath: string): StepFolderItem[]{
        console.log('getSubfoldersAsTreeItems() has been called');
        if (this.pathExists(targetFolderPath)) {
            console.log('path exists: ', targetFolderPath);
            // let allFolders = pf.getAllSubfolders(targetFolderPath, []); // TODO: get only direct subfolders
            let allFolders = fs.readdirSync(targetFolderPath).map(item => path.join(targetFolderPath, item)).filter(item => fs.statSync(item).isDirectory());
            console.log('getSubfoldersAsTreeItems allFolders: ', allFolders);

            return allFolders.map((folder: string) => {
                let foldername = path.basename(folder);
                return new StepFolderItem(foldername, '', vscode.TreeItemCollapsibleState.Collapsed, folder);
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
                return new StepFileItem(filename, '', vscode.TreeItemCollapsibleState.Collapsed, file);
            });

        } else {
            console.log('path does not exist: ', targetFolderPath);
            return [];
        }
    }

    private getStepsFromStepFileAsTreeItems(targetFilePath: string): StepItem[] {
        const parseSteps = (stepParser: StepDefinitionParser) => {
            let steps = stepParser.getStepRegexpressions(targetFilePath);
            if (steps.length > 0) {
                return steps
                    .filter(step => step.match(this.searchFilter||/.*/ig))
                    .map(step => new StepItem(step, '', vscode.TreeItemCollapsibleState.None, targetFilePath));
            } else {
                console.log('file is empty: ', targetFilePath);
                vscode.window.showInformationMessage('File is empty: \n' + targetFilePath);
                return [];
            }
        };
        if (this.pathExists(targetFilePath)) {
            const languageConfig = vscode.workspace.getConfiguration().get('vcspTree.language');
            if(languageConfig){
                let stepParser = new StepDefinitionParserJS;
                return parseSteps(stepParser);
            } else {
                return [];
            }   
        }else {
            console.log('path does not exist: ', targetFilePath);
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
        // console.log('tooltip() has been called');
        return '';
    }

    get description(): string {
        // console.log('description() has been called');
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
        // console.log('tooltip() has been called');
        return `Click to add to clipboard.`;
    }

    get description(): string {
        // console.log('description() has been called');
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
        // console.log('tooltip() has been called');
        return `Click to expand ${this.itemPath || ''}`; 
    }

    get description(): string {
        // console.log('description() has been called');
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
        // console.log('tooltip() has been called');
        return `Click to expand ${this.itemPath || ''}`; 
    }

    get description(): string {
        // console.log('description() has been called');
        return this.version;
    }

    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'string.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'string.svg')
    };

    contextValue = 'StepsFolder';

}

