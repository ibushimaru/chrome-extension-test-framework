// Internationalization utilities

export const i18n = {
  // Translate all elements with data-i18n attribute
  translateDocument() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const messageKey = element.getAttribute('data-i18n');
      const translation = chrome.i18n.getMessage(messageKey);
      if (translation) {
        element.textContent = translation;
      }
    });
  },
  
  // Get a specific message
  getMessage(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions);
  }
};