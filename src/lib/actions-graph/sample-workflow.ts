/** 初期表示・「サンプル」ボタンで使用するサンプルworkflow YAML */
export const SAMPLE_WORKFLOW_YAML = `name: deploy.yml
on: push

jobs:
  build-1:
    runs-on: ubuntu-latest
    steps: [{ run: echo build-1 }]
  build-2:
    runs-on: ubuntu-latest
    steps: [{ run: echo build-2 }]
  build-3:
    runs-on: ubuntu-latest
    steps: [{ run: echo build-3 }]

  integration-1:
    needs: [build-1]
    runs-on: ubuntu-latest
    steps: [{ run: echo it-1 }]
  integration-2:
    needs: [build-1]
    runs-on: ubuntu-latest
    steps: [{ run: echo it-2 }]

  lint:
    needs: [build-2]
    runs-on: ubuntu-latest
    steps: [{ run: echo lint }]

  unit-test:
    needs: [build-3]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [18, 20, 22]
    steps: [{ run: echo test }]

  deploy:
    needs: [integration-1, integration-2, lint, unit-test]
    runs-on: ubuntu-latest
    steps: [{ run: echo deploy }]
`
