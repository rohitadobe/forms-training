import { subscribe } from '../../rules/index.js';

async function fetchAndUpdateConsentContent(contentURL, element, checkbox) {
  try {
    const response = await fetch(contentURL, { priority: 'low' });
    const text = await response.text();

    const container = document.createElement('div');
    container.innerHTML = text;

    const consentSummary = container.querySelector('.consent-summary')?.innerHTML;
    const consentContent = container.querySelector('.consent-content')?.innerHTML;

    const consentSummaryElement = element.querySelector(`label[for="${checkbox?.id}"]`);
    const consentContentElement = element.querySelector('.modal-content > div.plain-text-wrapper');

    if (consentSummaryElement && consentSummary) {
      consentSummaryElement.innerHTML = consentSummary;
    }

    if (consentContentElement && consentContent) {
      consentContentElement.innerHTML = consentContent;
    }
  } catch (error) {
    console.error('Error fetching consent content:', error);
  }
}

export default function decorate(element, fd, container, formId) {
  element.classList.add('consent-popup-wrapper');

  const { consentType, contentURL, showModal = true } = fd.properties || {};

  subscribe(element, formId, (_element, model) => {
    if (!model) return;

    const checkbox = model.items?.find((item) => item.fieldType === 'checkbox');
    const modal = model.items?.find((item) => item[':type'] === 'modal');
    const button = modal?.items?.find(
      (item) => item.fieldType === 'button' && item.name?.startsWith('consentbutton')
    );
    const consentTypeTextinput = model.items?.find(
      (item) => item.fieldType === 'text-input' && item.visible === false
    );

    model.properties = { ...model.properties, isModelVisible: false };

    if (!checkbox || !modal || !button) return;

    const checkboxElement = element.querySelector(`input[id="${checkbox?.id}"]`);
    const links = element.querySelectorAll('a[href="#open-modal"]');
    const buttonElement = element.querySelector(`button[id="${button?.id}"]`);

    function openModal() {
      modal.visible = true;
      setTimeout(() => {
        const dialog = element.querySelector('dialog');
        if (dialog) initGoToBottom(dialog);
      }, 100);
    }

    if (contentURL) {
      fetchAndUpdateConsentContent(contentURL, element, checkbox);
    }

    /* ========== GO TO BOTTOM FUNCTIONALITY ========== */
    function initGoToBottom(dialog) {
      const modalContent = dialog.querySelector('.modal-content');
      const goToBottomBtn = dialog.querySelector('button[name="gotobottom"]');

      if (!modalContent || !goToBottomBtn) return;

      // Reset button state
      goToBottomBtn.style.setProperty('display', 'flex', 'important');
      goToBottomBtn.type = 'button';

      const toggleButtonVisibility = () => {
        if (!document.body.contains(dialog)) return;

        const isScrollable =
          modalContent.scrollHeight > modalContent.clientHeight;

        if (!isScrollable) {
          goToBottomBtn.style.setProperty('display', 'none', 'important');
          return;
        }

        const atBottom =
          modalContent.scrollTop + modalContent.clientHeight >=
          modalContent.scrollHeight - 10;

        goToBottomBtn.style.setProperty(
          'display',
          atBottom ? 'none' : 'flex',
          'important'
        );
      };

      goToBottomBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        modalContent.scrollTo({
          top: modalContent.scrollHeight,
          behavior: 'smooth',
        });

        setTimeout(toggleButtonVisibility, 200);
      });

      modalContent.addEventListener('scroll', toggleButtonVisibility);

      requestAnimationFrame(toggleButtonVisibility);
    }

    let consentLoaded = false;

    async function ensureConsentLoaded() {
      if (!consentLoaded && contentURL) {
        consentLoaded = true;
        await fetchAndUpdateConsentContent(contentURL, element, checkbox);
      }
    }

    model.subscribe((e) => {
      const { payload } = e;

      payload?.changes?.forEach((change) => {
        if (change?.propertyName === 'properties') {
          const { currentValue: properties } = change;

          if (properties?.contentURL && properties.contentURL !== contentURL) {
            consentLoaded = false;
            ensureConsentLoaded();
          }
        }
      });
    });

    if (checkbox.required) {
      const dialog = element.querySelector('dialog');

      if (dialog) {
        dialog.closest('div')?.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && checkbox.required) {
            e.preventDefault();
            e.stopPropagation();
          }
        });
      }
    }

    if (checkboxElement) {
      checkboxElement.addEventListener('change', async () => {
        if (!checkbox.checked && checkboxElement.checked) {
          if (showModal) {
            checkboxElement.checked = false;
            await ensureConsentLoaded();
            openModal();
            modal.visible = true;
            model.properties.isModelVisible = true;
          } else {
            checkboxElement.checked = true;
            checkbox.checked = true;
          }
        }
      });

      if (showModal && links.length > 0) {
        links.forEach((link) => {
          link.style.pointerEvents = 'auto';
          link.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
            model.properties.isModelVisible = true;
          });
        });
      }

      if (consentTypeTextinput) {
        consentTypeTextinput.value = consentType;
      }

      if (showModal && button) {
        buttonElement.addEventListener('click', () => {
          modal.visible = false;

          checkboxElement.checked = true;
          checkbox.checked = true;

          model.properties.isModelVisible = false;
        });
      }
    }

    const consentTypeField = _element.querySelector('.field-consenttype');

    if (consentTypeField) {
      consentTypeField.classList.remove('field-valid');
    }
  });
}
