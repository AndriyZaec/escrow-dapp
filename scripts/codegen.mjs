import { readFileSync } from 'fs';
import { createFromRoot } from 'codama';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { renderVisitor } from '@codama/renderers-js';

const idl = JSON.parse(readFileSync('./src/idl/escrow.json', 'utf-8'));
const codama = createFromRoot(rootNodeFromAnchor(idl));
codama.accept(renderVisitor('./src/generated', { deleteFolderBeforeRendering: true }));
console.log('✅ Generated Codama client');
