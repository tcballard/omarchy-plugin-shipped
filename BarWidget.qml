import QtQuick
import qs.Ui
import "lib/qml"
BarWidget {
 id: root
 moduleName: "io.github.tcballard.shipped"
 property var service: null
 function resolveService() { if (bar && bar.shell && typeof bar.shell.serviceFor === "function") service=bar.shell.serviceFor(moduleName) }
 onBarChanged: resolveService()
 Component.onCompleted: resolveService()
 Timer { interval: 1000; running: !root.service; repeat: true; onTriggered: root.resolveService() }
 readonly property bool opened: panel.opened
 function open(payloadJson) { panel.open(payloadJson) }
 function close() { panel.close() }
 implicitWidth: button.implicitWidth
 implicitHeight: button.implicitHeight
 StackGlyph {
  id: button
  anchors.fill: parent
  bar: root.bar
  text: root.vertical ? "↑" : (root.service ? root.service.snapshot.summary : "Shipped · unavailable")
  severity: root.service ? root.service.snapshot.severity || "watch" : "warn"
  tooltipText: "Shipped — click to open"
  onPressed: mouseButton => { if (panel.opened) panel.close(); else panel.open("") }
 }
 Panel { id: panel; bar: root.bar; anchorItem: button; hostWidget: root; service: root.service }
}
