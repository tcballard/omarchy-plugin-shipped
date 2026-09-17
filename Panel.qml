import QtQuick
import "lib/qml"
StackPanel {
 title: "Shipped"
 hints: "Enter open repository · w today / week · / search · Esc close"
 onAction: (id,key) => { if (service) service.act(id,key) }
}
