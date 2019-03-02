import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let projectFiles = {

    getStepsFolder(): string {
        let configValue = vscode.workspace.getConfiguration().get('vcspTree.stepsFolder');
        if (typeof configValue === 'string'){
            if (path.isAbsolute(configValue)){
                return configValue;
            } else {
                return path.join(vscode.workspace.rootPath || '', configValue );
            }
        } else {
            vscode.window.showErrorMessage('Wrong configuration for steps folder.');
            return '';
        }
        
    },
    
    getAllSubfolders(folder: string, array: string[], ignore?: string[]): string[] {
        // console.log('getAllSubfolders() has been called');
        let toIgnore = ignore || [];
        fs.readdirSync(folder).filter(item => fs.statSync(path.join(folder, item)).isDirectory())
            .filter(dir => !toIgnore.includes(dir))
            .map(subfolder => path.join(folder, subfolder)).map(subfolder => {
                if (!array.includes(subfolder)) {
                    array.push(subfolder);
                    this.getAllSubfolders(subfolder, array);
                }
            });
        return array;
    },
    getAllJSFilesInFolder(folder: string): string[] {
        console.log('getAllJSFilesInFolder() has been called');
        return fs
            .readdirSync(folder)
            .filter(item => fs.statSync(path.join(folder, item)).isFile())
            .filter(file => file.match(/.+\.js$/) !== null)
            .map(file => path.join(folder, file));
    }

};

module.exports = projectFiles;

