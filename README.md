# ventx-manager

Created by TSB

## Configuration

This project synchronizes data with GitHub. To enable API access, provide a
GitHub personal access token using the `EXPO_PUBLIC_GITHUB_TOKEN` environment
variable. Create a token at [github.com/settings/tokens](https://github.com/settings/tokens)
with at least the `repo` scope and add it to your `.env` file:

```
EXPO_PUBLIC_GITHUB_TOKEN=ghp_your_token_here
```

If the token is not set, the app will start but GitHub sync features will be
disabled.