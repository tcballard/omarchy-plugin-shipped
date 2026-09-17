import QtQuick
import qs.Commons
import qs.Ui

WidgetButton {
    property string severity: "ok"
    foreground: severity === "urgent" ? Color.urgent : severity === "warn" ? Color.urgent : severity === "watch" ? Color.accent : (bar ? bar.barForeground : Color.foreground)
}
