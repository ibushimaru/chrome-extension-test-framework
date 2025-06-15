// Module B depends on Module C
const moduleC = window.moduleC || {};

window.moduleB = {
    name: 'Module B',
    dependency: moduleC
};