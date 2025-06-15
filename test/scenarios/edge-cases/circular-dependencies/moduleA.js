// Module A depends on Module B
const moduleB = window.moduleB || {};

window.moduleA = {
    name: 'Module A',
    dependency: moduleB
};