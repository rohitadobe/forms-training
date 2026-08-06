import { createOptimizedPicture } from '../../../../scripts/aem.js';


export default function decorate(element, fieldJson, container, formId) {
    element.classList.add('card');
    element.querySelectorAll('.radio-wrapper').forEach((radioWrapper) => {
        const image = createOptimizedPicture('https://main--afb--jalagari.hlx.live/lab/images/card.png', 'card-image');
        radioWrapper.appendChild(image);
    });
    return element;
}
