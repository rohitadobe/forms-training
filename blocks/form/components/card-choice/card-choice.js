/**
 * Custom cards component
 * Based on: Radio Group
 */

/**
 * Decorates a custom form field component
 * @param {HTMLElement} fieldDiv - The DOM element containing the field wrapper.
 * @param {Object} fieldJson - The form json object for the component.
 * @param {HTMLElement} parentElement - The parent container element of the field.
 * @param {string} formId - The unique identifier of the form.
 */
import { createOptimizedPicture } from '../../../../scripts/aem.js';


export default function decorate(element, fieldJson, container, formId) {
    element.classList.add('card');
    element.querySelectorAll('.radio-wrapper').forEach((radioWrapper) => {
        const image = createOptimizedPicture('https://main--afb--jalagari.hlx.live/lab/images/card.png', 'card-image');
        radioWrapper.appendChild(image);
    });
    return element;
}
