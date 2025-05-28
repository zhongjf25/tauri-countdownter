
build:
	@pnpm i
	@pnpm run tauri build

run:
	@pnpm i
	@pnpm run tauri dev

arun:
	@pnpm i
	@pnpm tauri android dev

abuild:
	@pnpm i
	@pnpm tauri android build