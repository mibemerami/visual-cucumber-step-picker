
import * as fs from 'fs';
import {join} from 'path';

let projectFiles = {
    
    getAllSubfolders(folder: string, array: string[], ignore?: string[]): string[] {
        // console.log('getAllSubfolders() has been called');
        let toIgnore = ignore || [];
        fs.readdirSync(folder).filter(item => fs.statSync(join(folder, item)).isDirectory())
            .filter(dir => !toIgnore.includes(dir))
            .map(subfolder => join(folder, subfolder)).map(subfolder => {
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
            .filter(item => fs.statSync(join(folder, item)).isFile())
            .filter(file => file.match(/.+\.js$/) !== null)
            .map(file => join(folder, file));
    }

};

module.exports = projectFiles;

