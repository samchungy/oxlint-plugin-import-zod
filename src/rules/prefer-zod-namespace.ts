import type { ESTree, Rule } from "@oxlint/plugins";

type ImportSpecifier = ESTree.ImportSpecifier;
type ImportDefaultSpecifier = ESTree.ImportDefaultSpecifier;
type ImportDeclaration = ESTree.ImportDeclaration;
type ImportDeclarationSpecifier = ESTree.ImportDeclarationSpecifier;
type NamespaceTarget = ImportSpecifier | ImportDefaultSpecifier;

const CORE_SUBMODULE_SOURCE = "zod/v4";
const CORE_SUBMODULE_NAME = "core";
// Default imports (any local name) are always converted; named imports only
// need converting when they bind one of these exports.
const NAMESPACE_TARGET_NAMES = new Set(["z", CORE_SUBMODULE_NAME]);

const isImportSpecifier = (specifier: ImportDeclarationSpecifier): specifier is ImportSpecifier =>
  specifier.type === "ImportSpecifier";

const isImportDefaultSpecifier = (
  specifier: ImportDeclarationSpecifier,
): specifier is ImportDefaultSpecifier => specifier.type === "ImportDefaultSpecifier";

const getImportedName = (specifier: ImportSpecifier): string =>
  specifier.imported.type === "Identifier" ? specifier.imported.name : "";

// `core` imported from `zod/v4` has its own namespace entry point at
// `zod/v4/core`; every other import keeps its original source.
const resolveNamespaceSource = (importedName: string, originalSource: string): string =>
  importedName === CORE_SUBMODULE_NAME && originalSource === CORE_SUBMODULE_SOURCE
    ? `${originalSource}/${importedName}`
    : originalSource;

// Renders a single specifier back to source text, preserving aliasing and
// per-specifier `type` modifiers (which only matter outside a type-only import).
const printSpecifier = (specifier: NamespaceTarget, isTypeOnlyImport: boolean): string => {
  if (specifier.type === "ImportDefaultSpecifier") {
    return specifier.local.name;
  }

  const importedName = getImportedName(specifier);
  const localName = specifier.local.name;
  const typeModifier = !isTypeOnlyImport && specifier.importKind === "type" ? "type " : "";

  return importedName === localName
    ? `${typeModifier}${importedName}`
    : `${typeModifier}${importedName} as ${localName}`;
};

// Renders `import [type] Default, { named, ... } from '<source>';` for
// whatever mix of default/named specifiers remains after extracting a target.
const printImportStatement = (
  specifiers: ImportDeclarationSpecifier[],
  source: string,
  isTypeOnlyImport: boolean,
): string => {
  const parts: string[] = [];
  const defaultSpecifier = specifiers.find(isImportDefaultSpecifier);
  const namedSpecifiers = specifiers.filter(isImportSpecifier);

  if (defaultSpecifier) {
    parts.push(printSpecifier(defaultSpecifier, isTypeOnlyImport));
  }
  if (namedSpecifiers.length > 0) {
    parts.push(`{ ${namedSpecifiers.map((s) => printSpecifier(s, isTypeOnlyImport)).join(", ")} }`);
  }

  return `import ${isTypeOnlyImport ? "type " : ""}${parts.join(", ")} from '${source}';`;
};

const printNamespaceImport = (
  localName: string,
  source: string,
  isTypeOnlyImport: boolean,
): string => `import ${isTypeOnlyImport ? "type " : ""}* as ${localName} from '${source}';`;

const rule: Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce using namespace imports for zod",
      url: "https://github.com/samchungy/oxlint-plugin-import-zod/blob/main/docs/rules/prefer-zod-namespace.md",
    },
    fixable: "code",
    schema: [],
    messages: {
      preferNamespaceImport:
        'Import zod as a namespace (import * as z from "zod") instead of destructuring its exports or using default imports',
    },
  },

  createOnce(context) {
    return {
      ImportDeclaration(node: ImportDeclaration) {
        // Only target imports from 'zod' or 'zod/*'
        if (node.source.value !== "zod" && !node.source.value.startsWith("zod/")) {
          return;
        }

        // Single pass over specifiers instead of filtering the array twice.
        const namedSpecifiers: ImportSpecifier[] = [];
        const defaultSpecifiers: ImportDefaultSpecifier[] = [];
        for (const specifier of node.specifiers) {
          if (isImportSpecifier(specifier)) {
            namedSpecifiers.push(specifier);
          } else if (isImportDefaultSpecifier(specifier)) {
            defaultSpecifiers.push(specifier);
          }
        }

        const targets: NamespaceTarget[] = [
          ...defaultSpecifiers,
          ...namedSpecifiers.filter((s) => NAMESPACE_TARGET_NAMES.has(getImportedName(s))),
        ];
        if (targets.length === 0) {
          return;
        }

        const isTypeOnlyImport = node.importKind === "type";
        const originalSource = node.source.value;

        for (const target of targets) {
          const importedName =
            target.type === "ImportSpecifier" ? getImportedName(target) : undefined;
          const importSource =
            importedName === undefined
              ? originalSource
              : resolveNamespaceSource(importedName, originalSource);
          const isSubmoduleImport = importSource !== originalSource;

          context.report({
            node: target,
            messageId: "preferNamespaceImport",
            fix(fixer) {
              const namespaceImport = printNamespaceImport(
                target.local.name,
                importSource,
                isTypeOnlyImport,
              );

              const remainingSpecifiers = node.specifiers.filter((s) => s !== target);

              // Either nothing else is imported from this source, or everything left
              // over also targets this same submodule namespace (and gets its own fix).
              const canReplaceWhole =
                remainingSpecifiers.length === 0 ||
                (isSubmoduleImport &&
                  remainingSpecifiers.every(
                    (s) => isImportSpecifier(s) && getImportedName(s) === importedName,
                  ));

              if (canReplaceWhole) {
                return fixer.replaceText(node, namespaceImport);
              }

              const remainderImport = printImportStatement(
                remainingSpecifiers,
                originalSource,
                isTypeOnlyImport,
              );

              return fixer.replaceText(node, `${namespaceImport}\n${remainderImport}`);
            },
          });
        }
      },
    };
  },
};

export default rule;
