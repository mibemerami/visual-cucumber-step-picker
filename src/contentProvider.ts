import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {StepDefinitionParser} from './stepDefinitionParser'

export class DepNodeProvider implements vscode.TreeDataProvider<Dependency> {

    private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined> = new vscode.EventEmitter<Dependency | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Dependency | undefined> = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot: string) {
        console.log('DepNodeProvider has been called with: ', workspaceRoot );
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Dependency): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Dependency): Thenable<Dependency[]> {
        console.log('getChildren has been called')
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }

        if (element) {
            return Promise.resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')));
        } else {
            const packageJsonPath = path.join('', this.workspaceRoot);
            if (this.pathExists(packageJsonPath)) {
                return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
            } else {
                vscode.window.showInformationMessage('Workspace has no package.json');
                return Promise.resolve([]);
            }
        }

    }

    private getAllSubfolders (folder: string, array: string[]): string[] {
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
        return fs
            .readdirSync(folder)
            .filter(item => fs.statSync(path.join(folder, item)).isFile())
            .filter(file => file.match(/.+\.js$/) !== null)
            .map(file => path.join(folder, file));
    }
    private readSteps(filepath: string): string[]  {
        console.log('readSteps has been called')
        let stepsRaw = fs.readFileSync(filepath, { encoding: "UTF-8" });
        let steps = stepsRaw.match(/(\/.*\/)/gm);
        if (steps === null) steps = []; 
        console.log('steps: ', steps)
        return steps;
    } 
	/**
	 * Given the path to package.json, read all its dependencies and devDependencies.
	 */
    private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
        if (this.pathExists(packageJsonPath)) {
            console.log('path exists: ', packageJsonPath);
            let stepParser = new StepDefinitionParser;
            let allFolders = this.getAllSubfolders(packageJsonPath, [packageJsonPath]);
            let allFiles: string[]  = [];
            allFolders.map(folder =>
                this.getAllJSFilesInFolder(folder).map(file => allFiles.push(file))
            );
            console.log('All files: ', allFiles);
            let allSteps: string[] = [];
            // allFiles.forEach(file => {allSteps.concat(this.readSteps(file))});
            // allFiles.map(file => this.readSteps(file)).map(stepArray => stepArray.map(step => allSteps.push(step)));
            allFiles.map(file => stepParser.getStepRegexpressions(file)).map(stepArray => stepArray.map(step => allSteps.push(step)));
            console.log('All steps: ', allSteps);
            return allSteps.map(step => new Dependency(step, 'step, regex: ' + step, vscode.TreeItemCollapsibleState.Collapsed));
            /*const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

            const toDep = (moduleName: string, version: string): Dependency => {
                if (this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
                    return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed);
                } else {
                    return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.None, {
                        command: 'extension.openPackageOnNpm',
                        title: '',
                        arguments: [moduleName]
                    });
                }
            }

            const deps = packageJson.dependencies
                ? Object.keys(packageJson.dependencies).map(dep => toDep(dep, packageJson.dependencies[dep]))
                : [];
            const devDeps = packageJson.devDependencies
                ? Object.keys(packageJson.devDependencies).map(dep => toDep(dep, packageJson.devDependencies[dep]))
                : [];
            return deps.concat(devDeps); */
        } else {
            console.log('path does not exist: ', packageJsonPath);
            return [];
        }
    }

    private pathExists(p: string): boolean {
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }

        return true;
    }
}

export class Dependency extends vscode.TreeItem {

    constructor(
        public readonly label: string,
        private version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        console.log('DepNodeProvider has been called.');
    }

    get tooltip(): string {
        return `${this.label}-${this.version}`;
    }

    get description(): string {
        return this.version;
    }

    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };

    contextValue = 'dependency';

}