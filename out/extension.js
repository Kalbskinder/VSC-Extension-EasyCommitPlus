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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const mdInfoContent = `# Easy Commit +

Easy Commit + is a VSCode Extension that lets you commit changes to GitHub with just one click.

## Features

### One-Click Commit

- Commit all files with a commit message.
- Commit specific files with a commit message.
- Commit & push all files with a commit message.


---

### Word and Char counter

Select text to check the char and word count.


---

### Create Wochenbericht by template

You can rename your weekly report template to \`template.html\` and put it in the folder \`.easy-commit\`. You can then use the button in the sidebar to create a new weekly report with just the calendar week.
`;
const badges = [
    { count: 0, name: "🪙" },
    { count: 10, name: "🚀" },
    { count: 50, name: "🔥" },
    { count: 100, name: "🏆" }
];
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
            // Remove HTML tags
            let cleanText = text
                .replace(/\n/g, " ")
                .replace(/>\s+</g, "> <")
                .replace(/<\/?[^>]+(>|$)/g, "")
                .replace(/\s+/g, " ")
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
    const treeDataProvider = new SidebarProvider();
    vscode.window.registerTreeDataProvider('textCounterPanel', treeDataProvider);
    // Befehl für den Button: Git Commit
    const openGitCommitPanelCommand = vscode.commands.registerCommand('extension.openGitCommitPanel', () => {
        vscode.window.showInputBox({ prompt: 'Enter your Git Commit message' }).then(async (commitMessage) => {
            if (commitMessage) {
                const terminal = vscode.window.createTerminal("Git Commit");
                terminal.show();
                terminal.sendText("git add .");
                terminal.sendText(`git commit -m \"${commitMessage}\"`);
                terminal.sendText("git push --set-upstream origin $(git branch --show-current)");
            }
            await checkForBadges(context);
        });
    });
    const openGitSignleCommitPanelCommand = vscode.commands.registerCommand('extension.openGitSignleCommit', () => {
        vscode.window.showInputBox({ prompt: 'Enter your Git Commit message' }).then(async (commitMessage) => {
            if (commitMessage) {
                const terminal = vscode.window.createTerminal("Git Commit");
                terminal.show();
                terminal.sendText("git add .");
                terminal.sendText(`git commit -m \"${commitMessage}\"`);
            }
            await checkForBadges(context);
        });
    });
    const openGitSelectedFileCommit = vscode.commands.registerCommand('extension.openGitSelectedFileCommit', () => {
        vscode.window.showInputBox({
            prompt: 'Enter all files (index.html, main.js)'
        }).then(async (fileInput) => {
            if (!fileInput) {
                vscode.window.showErrorMessage("No files provided.");
                return;
            }
            const selectedFiles = fileInput.split(',')
                .map(file => file.trim())
                .filter(file => file.length > 0)
                .join(' ');
            if (selectedFiles.length === 0) {
                vscode.window.showErrorMessage("No valid files provided.");
                return;
            }
            // Commit-Message abfragen
            const commitMessage = await vscode.window.showInputBox({ prompt: 'Enter commit message' });
            if (!commitMessage) {
                vscode.window.showErrorMessage("Commit message cannot be empty.");
                return;
            }
            // 🖥️ Terminal-Befehl ausführen
            const terminal = vscode.window.createTerminal("Git Commit");
            terminal.show();
            terminal.sendText(`git add ${selectedFiles}`);
            terminal.sendText(`git commit -m "${commitMessage}"`);
            // ✅ Badges prüfen
            await checkForBadges(context);
        });
    });
    // Befehl zum Erstellen eines neuen Wochenberichts
    const createWeeklyReportCommand = vscode.commands.registerCommand('extension.createWeeklyReport', async () => {
        const input = await vscode.window.showInputBox({ prompt: 'Gib die Kalenderwoche ein (z.B. 12)' });
        if (!input) {
            vscode.window.showErrorMessage("Keine Kalenderwoche eingegeben!");
            return;
        }
        const year = new Date().getFullYear();
        const weekNumber = input.padStart(2, '0'); // 1-stellige KW in zweistellige umwandeln
        const fileName = `kw_${weekNumber}_${year}.html`;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("Kein geöffnetes Projekt gefunden!");
            return;
        }
        const easyCommitFolder = path.join(workspaceFolder, '.easy-commit');
        const infoFile = path.join(easyCommitFolder, 'info.md');
        if (!fs.existsSync(easyCommitFolder)) {
            fs.mkdirSync(easyCommitFolder);
        }
        if (!fs.existsSync(infoFile)) {
            fs.writeFileSync(infoFile, mdInfoContent, 'utf8');
        }
        const templatePath = path.join(workspaceFolder, '.easy-commit', 'template.html');
        const newFilePath = path.join(workspaceFolder, fileName);
        if (!fs.existsSync(templatePath)) {
            vscode.window.showErrorMessage("Vorlage 'template.html' nicht gefunden! Lege sie in '.easy-commit' ab.");
            return;
        }
        // Template einlesen und anpassen
        let templateContent = fs.readFileSync(templatePath, 'utf8');
        templateContent = templateContent
            .replace(/Wochenbericht KW[^ ]+ \d{4}/g, `Wochenbericht KW${weekNumber} ${year}`)
            .replace(/<h2>Tagesreflexionen<\/h2>[\s\S]*?(?=<h2>|$)/, `<h2>Tagesreflexionen</h2>\n${getFormattedDatesForWeek(parseInt(weekNumber), year)}`);
        fs.writeFileSync(newFilePath, templateContent, 'utf8');
        vscode.window.showInformationMessage(`Neuer Wochenbericht erstellt: ${fileName}`);
        // Datei im Editor öffnen
        const document = await vscode.workspace.openTextDocument(newFilePath);
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('editor.action.formatDocument');
    });
    context.subscriptions.push(openGitCommitPanelCommand);
    context.subscriptions.push(openGitSignleCommitPanelCommand);
    context.subscriptions.push(createWeeklyReportCommand);
}
// Sidebar Provider
class SidebarProvider {
    getTreeItem(element) {
        return element;
    }
    async getChildren() {
        // Gitbhub features
        // Commit all changes
        const commitButton = new vscode.TreeItem("Commit all changes", vscode.TreeItemCollapsibleState.None);
        commitButton.command = {
            command: "extension.openGitSignleCommit",
            title: "Open Git Commit Panel"
        };
        commitButton.iconPath = new vscode.ThemeIcon('remote-explorer-documentation');
        // Commit & Push all changes
        const commitPushButton = new vscode.TreeItem("Commit & Push", vscode.TreeItemCollapsibleState.None);
        commitPushButton.command = {
            command: "extension.openGitCommitPanel",
            title: "Single Commit"
        };
        commitPushButton.iconPath = new vscode.ThemeIcon('source-control-view-icon');
        // Commit specific files
        const commitSelectedFile = new vscode.TreeItem("Commit specific files", vscode.TreeItemCollapsibleState.None);
        commitSelectedFile.command = {
            command: "extension.openGitSelectedFileCommit",
            title: "Commit Selected File"
        };
        commitSelectedFile.iconPath = new vscode.ThemeIcon('source-control-view-icon');
        // Commit count
        const commitCount = await getCommitCount();
        const filteredBadges = badges.filter(b => commitCount >= b.count);
        const badgeElement = filteredBadges.pop();
        let commitDisplay;
        if (badgeElement) {
            const badgeIcon = badgeElement.name;
            commitDisplay = new vscode.TreeItem(`[${badgeIcon}] Total commits: ${commitCount}`, vscode.TreeItemCollapsibleState.None);
        }
        else {
            commitDisplay = new vscode.TreeItem(`Total commits: ${commitCount}`, vscode.TreeItemCollapsibleState.None);
        }
        commitDisplay.iconPath = new vscode.ThemeIcon('star-full');
        // Divider
        const spacer = new vscode.TreeItem(" ", vscode.TreeItemCollapsibleState.None);
        // Wochenbericht features
        const createReportButton = new vscode.TreeItem("New weekly report", vscode.TreeItemCollapsibleState.None);
        createReportButton.command = {
            command: "extension.createWeeklyReport",
            title: "Create Weekly Report",
        };
        createReportButton.iconPath = new vscode.ThemeIcon('new-file');
        return [commitButton,
            commitPushButton,
            commitSelectedFile,
            commitDisplay,
            spacer,
            createReportButton
        ];
    }
}
// Funktion zum Berechnen der Datumswerte für die Tagesreflexionen
function getFormattedDatesForWeek(weekNumber, year) {
    // ISO 8601 Wochensystem: Der erste Montag des Jahres
    const firstDayOfYear = new Date(year, 0, 1);
    // Berechne den Tag der Woche für den 1. Januar
    const dayOfWeek = firstDayOfYear.getDay();
    // Wenn der 1. Januar auf ein Sonntag fällt, dann müssen wir den ersten Montag am 2. Januar suchen
    const daysToFirstMonday = (dayOfWeek === 0 ? 1 : 1 - dayOfWeek);
    // Setze das Datum auf den ersten Montag des Jahres
    firstDayOfYear.setDate(firstDayOfYear.getDate() + daysToFirstMonday);
    // Berechne den Montag der gewünschten Kalenderwoche
    const weekStart = new Date(firstDayOfYear);
    weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7); // Wochenoffset
    const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
    const months = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    // Erstelle die HTML-Tags für jeden Wochentag
    return days.map((day, index) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + index);
        const dayNumber = date.getDate();
        const monthName = months[date.getMonth()];
        const location = index < 2 ? "BBW" : "ZLI";
        return `<strong>${location}, ${day}, ${dayNumber}. ${monthName} ${year}</strong><br>\nTagesreflektion (min. 200 und max. 500 Zeichen)\n<hr>`;
    }).join("\n");
}
/* ==========================================
 * Commit badges
 *=========================================== */
async function getCommitCount() {
    return new Promise((resolve, reject) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!workspaceFolder) {
            reject("Kein geöffnetes Projekt gefunden!");
            return;
        }
        const exec = require('child_process').exec;
        exec('git rev-list --count HEAD', { cwd: workspaceFolder }, (err, stdout) => {
            if (err) {
                reject("Fehler beim Abrufen der Commit-Anzahl.");
            }
            else {
                resolve(parseInt(stdout.trim(), 10));
            }
        });
    });
}
async function checkForBadges(context) {
    const commitCount = await getCommitCount();
    const lastBadge = context.globalState.get("lastBadge", 0);
    for (const badge of badges) {
        if (commitCount >= badge.count && lastBadge < badge.count) {
            vscode.window.showInformationMessage(`🎉 Glückwunsch! Du hast das Badge "${badge.name}" erhalten!`);
            context.globalState.update("lastBadge", badge.count);
            break; // Nur das erste neue Badge anzeigen
        }
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map