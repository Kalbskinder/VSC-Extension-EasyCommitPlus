"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    // Statusbar für Zeichen- und Wortzählung
    let statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.tooltip = "Char & Wordcount";
    context.subscriptions.push(statusBar);
    // Event Listener für Auswahl-Änderungen
    let disposable = vscode.window.onDidChangeTextEditorSelection(updateStatusBar);
    context.subscriptions.push(disposable);
    function updateStatusBar() {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            statusBar.hide();
            return;
        }
        let selection = editor.selection;
        let text = editor.document.getText(selection);
        if (text.length > 0) {
            // HTML-Tags mit Regex entfernen
            let cleanText = text
                .replace(/\n/g, " ") // Zeilenumbrüche durch Leerzeichen ersetzen
                .replace(/>\s+</g, "> <") // Leerzeichen zwischen HTML-Tags hinzufügen!
                .replace(/<\/?[^>]+(>|$)/g, "") // HTML-Tags entfernen
                .replace(/\s+/g, " ") // Mehrere Leerzeichen in eines umwandeln
                .trim();
            let wordCount = cleanText.trim().split(/\s+/).filter(word => word.length > 0).length;
            let charCount = cleanText.length;
            statusBar.text = `$(pencil) ${charCount} Zeichen, ${wordCount} Wörter`;
            statusBar.show();
        }
        else {
            statusBar.hide();
        }
    }
    updateStatusBar();
    // Sidebar hinzufügen
    const treeDataProvider = new GitCommitViewProvider();
    vscode.window.registerTreeDataProvider('textCounterPanel', treeDataProvider);
    // Befehl für den Button
    const openGitCommitPanelCommand = vscode.commands.registerCommand('extension.openGitCommitPanel', () => {
        vscode.window.showInputBox({ prompt: 'Enter your Git Commit message' }).then(commitMessage => {
            if (commitMessage) {
                const terminal = vscode.window.createTerminal("Git Commit");
                terminal.show();
                terminal.sendText("git add .");
                terminal.sendText(`git commit -m \"${commitMessage}\"`);
                terminal.sendText("git push --set-upstream origin $(git branch --show-current)");
            }
        });
    });
    context.subscriptions.push(openGitCommitPanelCommand);
}
class GitCommitViewProvider {
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        const commitButton = new vscode.TreeItem("📌 Commit Wochenbericht", vscode.TreeItemCollapsibleState.None);
        commitButton.command = {
            command: "extension.openGitCommitPanel",
            title: "Open Git Commit Panel"
        };
        commitButton.iconPath = new vscode.ThemeIcon('git-commit');
        return [commitButton];
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map