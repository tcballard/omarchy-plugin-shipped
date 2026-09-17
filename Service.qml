import QtQuick
import Quickshell.Io
import "lib/qml"
Item {
 id: root
 property var shell: null
 property var manifest: null
 property string omarchyPath: ""
 property var snapshot: ({status:"loading",rows:[],summary:"Loading…",severity:"watch"})
 property string message: ""
 property string helper: Qt.resolvedUrl("cli.cjs").toString().replace(/^file:\/\//, "")
 function refresh() { collector.start(["node", helper, "snapshot"]) }
 function act(id, key) { if (actions.running) return; message="Opening action…"; actions.start(["node", helper, "action", id, key]) }
 StackProcess {
  id: collector
  onResult: value => { root.snapshot = value; root.message = value.error || "" }
  onFinished: { if (lastError) root.message = lastError }
 }
 StackProcess {
  id: actions
  onResult: value => { root.message = value.error || "Command ready in terminal, or action completed" }
  onFinished: { if (lastError) root.message = lastError; root.refresh() }
 }
 Timer { interval: 60000; running: true; repeat: true; triggeredOnStart: true; onTriggered: root.refresh() }
 
 IpcHandler {
  target: "io.github.tcballard.shipped"
  function refresh(): void { root.refresh() }
  function status(): string { return JSON.stringify({status:root.snapshot.status,summary:root.snapshot.summary,error:root.message}) }
 }
}
