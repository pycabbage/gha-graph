export default {
  "*.{ts,tsx,js,jsx}": [
    "oxfmt --no-error-on-unmatched-pattern",
    "oxlint --no-error-on-unmatched-pattern --fix",
  ],
}
