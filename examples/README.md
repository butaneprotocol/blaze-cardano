# Examples

This is where we keep examples as independent npm projects not managed along with the rest of the monorepo but instead individually. These are not to be published but perhaps they can serve as templates for a blaze-create command.

## Adding an example

Basically just create any javascript project within a directory in this folder.
When adding/installing dependencies please use `pnpm` like so:

```bash
pnpm --ignore-workspace install @blaze-cardano/sdk
```

> Note: `--ignore-workspace` is important to avoid the monorepo setup.
