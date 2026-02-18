# aws-template-validator

<p align="center"><a href="https://nodei.co/npm/aws-template-validator/"><img src="https://nodei.co/npm/aws-template-validator.png"></a></a></p>
<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg">
</p>

* ☁️ Validate AWS CloudFormation templates using the `AWS CloudFormation API (SDK v3)`. Works with `JSON` or `YAML` templates.
* 👨‍💻 Can be used as `CLI` via `npx`/`global link` or as `module`
* ♻️ Works seamlessly with `CommonJS`, `ESM` and `TypeScript`

# 📦 Install via [NPM](https://www.npmjs.com/package/aws-template-validator)

```bash
$ npm i aws-template-validator
```

# 💻 Usage

## CLI (Validate a local template file)
```bash
npx aws-template-validator ./my-template.yaml
```

## CommonJS
```javascript
const { validateWithAWS } = require('aws-template-validator');

const templateFile = './path/to/my-template.yaml';

const runValidation = async () => {
    try {
        await validateWithAWS(templateFile);
    } catch (err) {
        console.error('❌ Template validation failed:', err)
    }
}

runValidation();
```

## ESM
```javascript
import { validateWithAWS } from 'aws-template-validator';

const templateFile = './path/to/my-template.yaml';

const runValidation = async () => {
    try {
        await validateWithAWS(templateFile);
    } catch (err) {
        console.error('❌ Template validation failed:', err)
    }
}

runValidation()
```

## TypeScript
```javascript
import { validateWithAWS } from 'aws-template-validator';

const templateFile: string = './path/to/my-template.yaml';

const runValidation = async () => {
    try {
        await validateWithAWS(templateFile);
    } catch (err) {
        console.error('❌ Template validation failed:', err)
    }
}

runValidation();
```
