# Native development

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

Build and debug iOS and macOS apps.

Codex works great on Apple platform projects when each pass has a build, run, or simulator loop attached to it.
These use cases are helpful when you are building new or existing iOS and macOS apps and need to iterate on the UI and debug issues.

## Build the app shell

Ask Codex to scaffold iOS and macOS apps with repeatable build loops. The Mac shell use case goes deeper on sidebar-detail-inspector layouts, commands, settings, and other desktop-native structure.

- [Build for iOS](https://developers.openai.com/codex/use-cases/native-ios-apps): Use Codex to scaffold iOS SwiftUI projects, keep the build loop CLI-first with `xcodebuild`...
- [Build for macOS](https://developers.openai.com/codex/use-cases/native-macos-apps): Use Codex to build macOS SwiftUI apps, wire a shell-first build-and-run loop, and add...
- [Build a Mac app shell](https://developers.openai.com/codex/use-cases/macos-sidebar-detail-inspector): Use Codex and the Build macOS Apps plugin to turn an app idea into a desktop-native...

## Refactor iOS SwiftUI screens

Use Codex to split large SwiftUI views without changing behavior, then move selected iOS flows to Liquid Glass when the app is ready.

- [Refactor SwiftUI screens](https://developers.openai.com/codex/use-cases/ios-swiftui-view-refactor): Use Codex and the Build iOS Apps plugin to break a long SwiftUI view into dedicated section...
- [Adopt liquid glass](https://developers.openai.com/codex/use-cases/ios-liquid-glass): Use Codex and the Build iOS Apps plugin to audit existing iPhone and iPad UI, replace custom...

## Expose iOS actions to the system

Leverage Codex to identify the actions and entities your app should expose through App Intents, so users can reach app behavior from system surfaces.

- [Add iOS app intents](https://developers.openai.com/codex/use-cases/ios-app-intents): Use Codex and the Build iOS Apps plugin to identify the actions and entities your app should...

## Debug your app

Have Codex reproduce bugs in Simulator or add telemetry to your macOS app to help you debug and fix issues.

- [Debug in iOS simulator](https://developers.openai.com/codex/use-cases/ios-simulator-bug-debugging): Use Codex to discover the right Xcode scheme and simulator, launch the app, inspect the UI...
- [Add Mac telemetry](https://developers.openai.com/codex/use-cases/macos-telemetry-logs): Use Codex and the Build macOS Apps plugin to add a few high-signal `Logger` events around...