/**
 * Stops event propagation and prevents the default event action.
 * @param {Object} e - DOM event.
 */
const stopEvent = function(e) {

	if (typeof e.stopPropagation === 'function') e.stopPropagation()
	if (typeof e.preventDefault === 'function') e.preventDefault()

}

/**
 * Validates options and sets defaults for undefined properties.
 * @param {?Object} opts
 * @returns {Object} opts - Validated options.
 */
const validate = function(opts = {}) {

	opts = Object.assign({}, opts)

	if (opts.closable == null) opts.closable = true
	if (opts.className == null) opts.className = ''
	if (opts.onShow == null) opts.onShow = () => {}
	if (opts.onClose == null) opts.onClose = () => {}
	if (opts.beforePlaceholder == null) opts.beforePlaceholder = ''
	if (opts.afterPlaceholder == null) opts.afterPlaceholder = ''

	if (typeof opts.closable !== 'boolean') throw new Error('Property `closable` must be a boolean')
	if (typeof opts.className !== 'string') throw new Error('Property `className` must be a string')
	if (typeof opts.onShow !== 'function') throw new Error('Property `onShow` must be a function')
	if (typeof opts.onClose !== 'function') throw new Error('Property `onClose` must be a function')
	if (typeof opts.beforePlaceholder !== 'string') throw new Error('Property `beforePlaceholder` must be a string')
	if (typeof opts.afterPlaceholder !== 'string') throw new Error('Property `afterPlaceholder` must be a string')

	return opts

}

/**
 * Checks if a DOM element's first child has a specific tag.
 * @param {Node} elem
 * @param {String} tag
 * @returns {Boolean} containsTag
 */
const containsTag = function(elem, tag) {

	const children = elem.children

	return (children.length === 1 && children[0].tagName === tag)

}

/**
 * Checks if a given or any lightbox element is visible.
 * @param {?Node} elem
 * @returns {Boolean} visible
 */
export const visible = function(elem) {

	elem = elem || document.querySelector('.basicLightbox')

	return (elem != null && elem.ownerDocument.body.contains(elem) === true)

}

/**
 * Creates a lightbox DOM element.
 * @param {?String} html - Lightbox content.
 * @param {Object} opts
 * @returns {Node} elem
 */
const render = function(html = '', opts) {

	const elem = document.createElement('div')

	// Add the default class
	elem.classList.add('basicLightbox')

	// Add a custom class when available
	if (opts.className !== '') elem.classList.add(...opts.className.split(' '))

	// Add lightbox content
	elem.innerHTML = `
		${ opts.beforePlaceholder }
		<div class="basicLightbox__placeholder" role="dialog">
			${ html }
		</div>
		${ opts.afterPlaceholder }
	`

	const placeholder = elem.querySelector('.basicLightbox__placeholder')

	// Check if placeholder contains a tag that requires a special treatment
	const img = containsTag(placeholder, 'IMG')
	const video = containsTag(placeholder, 'VIDEO')
	const iframe = containsTag(placeholder, 'IFRAME')

	// Add special treatment class when it only contains an image, a video or iframe.
	// This class is necessary to center the image, video or iframe.
	if (img === true) elem.classList.add('basicLightbox--img')
	if (video === true) elem.classList.add('basicLightbox--video')
	if (iframe === true) elem.classList.add('basicLightbox--iframe')

	return elem

}

/**
 * Shows a lightbox by appending a DOM element to the DOM.
 * @param {Node} elem
 * @param {Function} next - The callback that gets executed when the lightbox starts to show up.
 * @returns {Boolean} success
 */
const show = function(elem, next) {

	document.body.appendChild(elem)

	// Wait a while to ensure that the class change triggers the animation
	setTimeout(() => {
		requestAnimationFrame(() => {

			elem.classList.add('basicLightbox--visible')

			return next()

		})
	}, 10)

	return true

}

/**
 * Closes a lightbox by fading the element out and by removing the DOM element from the DOM.
 * @param {Node} elem
 * @param {Function} next - The callback that gets executed when the lightbox is fully closed.
 * @returns {Boolean} success
 */
const close = function(elem, next) {

	elem.classList.remove('basicLightbox--visible')

	setTimeout(() => {

		// Don't continue to remove lightbox when element missing
		if (visible(elem) === false) return next()

		elem.parentElement.removeChild(elem)

		return next()

	}, 410)

	return true

}

/**
 * Creats a new instance.
 * @param {?String} html - Lightbox content.
 * @param {?Object} opts
 * @returns {Object} instance
 */
export const create = function(html, opts) {

	// Validate options
	opts = validate(opts)

	// Render the lightbox element
	const elem = render(html, opts)

	// Returns the lightbox element
	const _element = () => {

		return elem

	}

	// Check if the lightbox is attached to the DOM
	const _visible = () => {

		return visible(elem)

	}

	// Show the lightbox
	const _show = (next) => {

		// Run onShow callback and stop execution when function returns false
		if (opts.onShow(instance) === false) return false

		// Show the lightbox
		return show(elem, () => {

			// Continue with the callback when available
			if (typeof next === 'function') return next(instance)

		})

	}

	// Hide the lightbox
	const _close = (next) => {

		// Run onClose callback and stop execution when function returns false
		if (opts.onClose(instance) === false) return false

		return close(elem, () => {

			// Continue with the callback when available
			if (typeof next === 'function') return next(instance)

		})

	}

	// Close lightbox when clicking the background
	if (opts.closable === true) elem.onclick = function(e) {

		// If e.target is not the same element as this,
		// then the user clicked a descendant of the element.
		if (e.target !== this) return

		// Close lightbox with the instance function
		_close()

		// Prevent default event and propagation
		stopEvent(e)

	}

	// Assign instance to a variable so the instance can be used
	// elsewhere in the current function.
	const instance = {
		element: _element,
		visible: _visible,
		show: _show,
		close: _close
	}

	return instance

}