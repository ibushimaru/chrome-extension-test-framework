// Module C depends on Module A (循環依存)
const moduleA = window.moduleA || {};

window.moduleC = {
    name: 'Module C',
    dependency: moduleA
};