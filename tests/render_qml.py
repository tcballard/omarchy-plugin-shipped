#!/usr/bin/env python3
"""Actual QML with explicit host stubs; never a claim of Quattro/Wayland testing."""
import json, os, sys
from pathlib import Path
os.environ.setdefault('QT_QPA_PLATFORM', 'offscreen')
from PySide6.QtCore import QUrl, QMetaObject, Qt
from PySide6.QtGui import QGuiApplication
from PySide6.QtQuick import QQuickWindow
from PySide6.QtQml import QQmlApplicationEngine
from PySide6.QtTest import QTest
root=Path(__file__).resolve().parents[1]
app=QGuiApplication([])
failed=[]
fixtures={
 'kamal': ('hey · last local deploy', [('hey · production','75bf6fa · 3 commits ahead','observed'),('hey · staging','Deploying · post-app-boot','observed')]),
 'focus-theft': ('2 suspected focus changes', [('Signal','New window took focus; intent unknown','inferred'),('Browser','Focus crossed workspace; intent unknown','inferred')]),
 'agent-triage': ('1 waiting · 1 working', [('mailbox','Waiting · 82 seconds · Claude Code hook','observed'),('arcade','Working · CPU activity','inferred'),('store','Idle; may need you','inferred')]),
 'drift': ('3 changes · 1 stale override', [('general:gaps_in','5 → 8 · stale override','observed'),('input:kb_layout','us → gb','observed'),('decoration:rounding','0 → 4','observed')]),
 'shipped': ('↑ 7 · ⇄ 2', [('Fix mailbox sync','hey · +24 / -6','observed'),('Preserve saved layouts','arcade · +81 / -12','observed'),('Handle empty query','store · +18 / -3','observed')]),
 'rails-radar': ('⚙ 2 apps · :3000 :3001', [('hey','web · :3000','observed'),('hey','jobs · Solid Queue','observed'),('hey','assets · Tailwind watcher','observed'),('basecamp','web · :3001','observed')]),
 'plugin-inspector': ('7 plugins inspected', [('Kamal','proc 1 · files ? · net 0 · root 0','inferred'),('Agent Triage','proc 1 · files ? · net 0 · root 0','inferred'),('Plugin Inspector','Source references; no runtime write attribution','declared')])
}
fixtures = {'shipped': fixtures['shipped']}
for name,(summary,records) in fixtures.items():
    engine=QQmlApplicationEngine()
    engine.addImportPath(str(root/'tests/qml'))
    warnings=[]
    engine.warnings.connect(lambda errors: warnings.extend(e.toString() for e in errors))
    rows=[dict(group='',id=str(i),title=a,detail=b,reliability=c,versions=['75bf6fa'],claim={},findings=[]) for i,(a,b,c) in enumerate(records)]
    fixture={'summary':summary+' · DEMO DATA','rows':rows,'severity':'ok','status':'ready'}
    source=f'''import QtQuick
import QtQuick.Window
import qs.Commons
import "{(root).as_uri()}" as Plugin
Window {{
 width: 800; height: 32; visible: true
 id: scene
 property int actions: 0
 property bool vertical: false
 QtObject {{ id: fake; property var snapshot: ({json.dumps(fixture)}); property string message: ""; function act(id,key) {{ scene.actions++ }} }}
 QtObject {{ id: bar; property bool vertical: scene.vertical; property int barSize: 32; property color barForeground: "#e4e8df"; property string position: "top" }}
 Plugin.BarWidget {{ id: widget; objectName: "widget"; bar: bar; service: fake }}
 Plugin.Panel {{ id: panel; objectName: "panel"; bar: bar; anchorItem: widget; service: fake; Component.onCompleted: Qt.callLater(function() {{ panel.open("") }}) }}
 Plugin.Service {{ id: serviceProbe; objectName: "service-probe" }}
 function closePanel() {{ panel.close() }}
 function reopen() {{ panel.open("{{}}"); panel.open("invalid") }}
}}
'''
    engine.loadData(source.encode(),QUrl.fromLocalFile(str(root/'tests'/(name+'-harness.qml'))))
    app.processEvents();QTest.qWait(150)
    objects=engine.rootObjects()
    if not objects:
        failed.append(name+': failed to load');continue
    scene=objects[0]
    wins=[w for w in app.allWindows() if w.isVisible() and w.height()>100]
    try:
        assert len(wins)==1, f'Expected one panel, got {len(wins)}'
        win=wins[0]
        assert win.grabWindow().save(str(root/'preview.png'))
        QMetaObject.invokeMethod(scene,'closePanel');app.processEvents()
        assert not win.isVisible(), 'Close must release surface'
        QMetaObject.invokeMethod(scene,'reopen');QTest.qWait(40)
        assert len([w for w in app.allWindows() if w.isVisible() and w.height()>100])==1
        QTest.keyClick(win,Qt.Key.Key_Escape);app.processEvents()
        assert not win.isVisible(), 'Escape closes panel'
        if warnings: raise AssertionError('\n'.join(warnings))
        print(name+': QML loaded; open/reopen/close/Escape passed; fixture preview captured')
    except Exception as e: failed.append(name+': '+str(e))
    engine.deleteLater();app.processEvents()
if failed:
    print('\n'.join(failed),file=sys.stderr);sys.exit(1)
