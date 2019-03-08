// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as contentProvider from './lib/contentProvider';
import * as path from 'path';
const pf = require('./lib/projectFiles');




export function activate(context: vscode.ExtensionContext) {
	// Add treeView, populated with items, to vscode
	let vcspTreeProvider = new contentProvider.StepsTreeProvider(pf.getStepsFolder());
	let vcspTreeView = vscode.window.createTreeView('vcspTree', { treeDataProvider: vcspTreeProvider } );

	// Handle events
	vcspTreeView.onDidChangeSelection(evnt => { 
		vcspTreeProvider.setSelectedTreeItem(evnt.selection[0]);  
		vscode.env.clipboard.writeText(evnt.selection[0].label||'');
	});
	vscode.workspace.onDidChangeConfiguration(configChangeEvent => {
		if (configChangeEvent.affectsConfiguration('vcspTree.stepsFolder')) {
			let newFolder = vscode.workspace.getConfiguration().get('vcspTree.stepsFolder'); 
			if (typeof newFolder === 'string') {
				vcspTreeProvider.setTargetFolder(newFolder);
				vcspTreeProvider.refresh();
			}
		}
	});

	// Define commands 
	vscode.commands.registerCommand('vcspTree.refreshEntry', () => vcspTreeProvider.refresh());
	vscode.commands.registerCommand('vcspTree.addEntry', () => console.log('addEntry has been called'));
	vscode.commands.registerCommand('vcspTree.writeFullStep', (item: vscode.TreeItem) => {
		console.log('write full step has been called');
		vscode.window.showQuickPick(['Given', 'When', 'Then', 'And', 'But'], { canPickMany: false}).then(
			selected => {
				let cleanedStep = cleanStep(item.label || '');
				let step = `${selected} ${cleanedStep}`;
				writeStepToFile(step);
			}
		);
	});
	vscode.commands.registerCommand('vcspTree.stepsDir', () => {
		console.log('stepsDir has been called');
		vscode.window.showOpenDialog(
				{canSelectFiles: false, canSelectFolders: true, canSelectMany: false}
			).then(folder => {
				console.log('selected folder: ', folder);
				if (folder) {
					let normalizedPath = process.platform === 'win32' 
						 ? folder[0].path.split('/').reduce((a, x) => path.join(a, x), '')
						 : folder[0].path;
					// vcspTreeProvider.setTargetFolder(normalizedPath);
					vscode.workspace.getConfiguration().update('vcspTree.stepsFolder', normalizedPath);
					// vcspTreeProvider.refresh();
				}
			});
	});
	vscode.commands.registerCommand('vcspTree.writeStep', (item: vscode.TreeItem) => {
		console.log('editEntry has been called');
		writeStepToFile(item.label || '');
	});

}


// Helpers:

function cleanStep(step: string): string {
	let pattern = vscode.workspace.getConfiguration().get('vcspTree.clearedStepFilter');
	let flags = vscode.workspace.getConfiguration().get('vcspTree.clearedStepFilterFlags');
	let filter: RegExp;
	if(typeof pattern === 'string' && typeof flags === 'string'){
		filter = new RegExp(pattern, flags);
	} else {
		filter = new RegExp('');
	}
	console.log('filter from config: ', filter);
	return step.replace(filter, '');
}

function writeStepToFile(step: string): void {
	let editor = vscode.window.activeTextEditor;
	if (editor) {
		console.log('selections: ', editor.selections);
		editor.edit(textEdit => {
			if (editor) {
				editor.selections.forEach(selection => {
					textEdit.delete(selection);
					textEdit.insert(selection.start, step+'\r\n'); // TODO: Check if there is a better way than +\r\n
				});
			}
		});
	}
	else {
		vscode.window.showInformationMessage('No active editor, to insert text.');
	}
}

// this method is called when the extension is deactivated
export function deactivate() {}
