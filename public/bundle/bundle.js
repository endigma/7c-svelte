
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop$1() { }
    function assign$1(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign$1($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function append$1(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty$1() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children$1(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }

    function bind$1(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop$1,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children$1(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop$1;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append$1(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * Iterates over the provided object by own enumerable keys with calling the iteratee function.
     *
     * @param object   - An object to iterate over.
     * @param iteratee - An iteratee function that takes the value and key as arguments.
     *
     * @return A provided object itself.
     */
    function forOwn$1(object, iteratee) {
        if (object) {
            const keys = Object.keys(object);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (key !== '__proto__') {
                    if (iteratee(object[key], key) === false) {
                        break;
                    }
                }
            }
        }
        return object;
    }

    function getSlides(splide) {
        const children = splide.Components.Elements?.list.children;
        return children && Array.prototype.slice.call(children) || [];
    }

    /**
     * Checks if the given subject is an object or not.
     *
     * @param subject - A subject to check.
     *
     * @return `true` if the subject is an object, or otherwise `false`.
     */
    function isObject$1(subject) {
        return subject !== null && typeof subject === 'object';
    }

    /**
     * Checks if provided two arrays are shallowly equal or not.
     *
     * @param subject1 - An array to test.
     * @param subject2 - Anther array to test.
     *
     * @return `true` if they are considered as equal, or otherwise `false`.
     */
    function isEqualDeep(subject1, subject2) {
        if (Array.isArray(subject1) && Array.isArray(subject2)) {
            return subject1.length === subject2.length
                && !subject1.some((elm, index) => !isEqualDeep(elm, subject2[index]));
        }
        if (isObject$1(subject1) && isObject$1(subject2)) {
            const keys1 = Object.keys(subject1);
            const keys2 = Object.keys(subject2);
            return keys1.length === keys2.length && !keys1.some(key => {
                return !Object.prototype.hasOwnProperty.call(subject2, key)
                    || !isEqualDeep(subject1[key], subject2[key]);
            });
        }
        return subject1 === subject2;
    }

    /**
     * Checks if provided two arrays are shallowly equal or not.
     *
     * @param array1 - An array to test.
     * @param array2 - Anther array to test.
     *
     * @return `true` if they are considered as equal, or otherwise `false`.
     */
    function isEqualShallow(array1, array2) {
        return array1.length === array2.length
            && !array1.some((elm, index) => elm !== array2[index]);
    }

    /**
     * Recursively merges source properties to the object.
     * Be aware that this method does not merge arrays. They are just duplicated by `slice()`.
     *
     * @param object - An object to merge properties to.
     * @param source - A source object to merge properties from.
     *
     * @return A new object with merged properties.
     */
    function merge$1(object, source) {
        const merged = object;
        forOwn$1(source, (value, key) => {
            if (Array.isArray(value)) {
                merged[key] = value.slice();
            }
            else if (isObject$1(value)) {
                merged[key] = merge$1(isObject$1(merged[key]) ? merged[key] : {}, value);
            }
            else {
                merged[key] = value;
            }
        });
        return merged;
    }

    /*!
     * Splide.js
     * Version  : 3.6.9
     * License  : MIT
     * Copyright: 2021 Naotoshi Fujita
     */
    const PROJECT_CODE = "splide";
    const DATA_ATTRIBUTE = `data-${PROJECT_CODE}`;

    const CREATED = 1;
    const MOUNTED = 2;
    const IDLE = 3;
    const MOVING = 4;
    const DESTROYED = 5;
    const STATES = {
      CREATED,
      MOUNTED,
      IDLE,
      MOVING,
      DESTROYED
    };

    const DEFAULT_EVENT_PRIORITY = 10;
    const DEFAULT_USER_EVENT_PRIORITY = 20;

    function empty(array) {
      array.length = 0;
    }

    function isObject(subject) {
      return !isNull(subject) && typeof subject === "object";
    }
    function isArray(subject) {
      return Array.isArray(subject);
    }
    function isFunction(subject) {
      return typeof subject === "function";
    }
    function isString(subject) {
      return typeof subject === "string";
    }
    function isUndefined(subject) {
      return typeof subject === "undefined";
    }
    function isNull(subject) {
      return subject === null;
    }
    function isHTMLElement(subject) {
      return subject instanceof HTMLElement;
    }

    function toArray(value) {
      return isArray(value) ? value : [value];
    }

    function forEach(values, iteratee) {
      toArray(values).forEach(iteratee);
    }

    function includes(array, value) {
      return array.indexOf(value) > -1;
    }

    function push(array, items) {
      array.push(...toArray(items));
      return array;
    }

    const arrayProto = Array.prototype;

    function slice(arrayLike, start, end) {
      return arrayProto.slice.call(arrayLike, start, end);
    }

    function find(arrayLike, predicate) {
      return slice(arrayLike).filter(predicate)[0];
    }

    function toggleClass(elm, classes, add) {
      if (elm) {
        forEach(classes, (name) => {
          if (name) {
            elm.classList[add ? "add" : "remove"](name);
          }
        });
      }
    }

    function addClass(elm, classes) {
      toggleClass(elm, isString(classes) ? classes.split(" ") : classes, true);
    }

    function append(parent, children) {
      forEach(children, parent.appendChild.bind(parent));
    }

    function before(nodes, ref) {
      forEach(nodes, (node) => {
        const parent = ref.parentNode;
        if (parent) {
          parent.insertBefore(node, ref);
        }
      });
    }

    function matches(elm, selector) {
      return isHTMLElement(elm) && (elm["msMatchesSelector"] || elm.matches).call(elm, selector);
    }

    function children(parent, selector) {
      return parent ? slice(parent.children).filter((child) => matches(child, selector)) : [];
    }

    function child(parent, selector) {
      return selector ? children(parent, selector)[0] : parent.firstElementChild;
    }

    function forOwn(object, iteratee, right) {
      if (object) {
        let keys = Object.keys(object);
        keys = right ? keys.reverse() : keys;
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (key !== "__proto__") {
            if (iteratee(object[key], key) === false) {
              break;
            }
          }
        }
      }
      return object;
    }

    function assign(object) {
      slice(arguments, 1).forEach((source) => {
        forOwn(source, (value, key) => {
          object[key] = source[key];
        });
      });
      return object;
    }

    function merge(object, source) {
      forOwn(source, (value, key) => {
        if (isArray(value)) {
          object[key] = value.slice();
        } else if (isObject(value)) {
          object[key] = merge(isObject(object[key]) ? object[key] : {}, value);
        } else {
          object[key] = value;
        }
      });
      return object;
    }

    function removeAttribute(elm, attrs) {
      if (elm) {
        forEach(attrs, (attr) => {
          elm.removeAttribute(attr);
        });
      }
    }

    function setAttribute(elm, attrs, value) {
      if (isObject(attrs)) {
        forOwn(attrs, (value2, name) => {
          setAttribute(elm, name, value2);
        });
      } else {
        isNull(value) ? removeAttribute(elm, attrs) : elm.setAttribute(attrs, String(value));
      }
    }

    function create(tag, attrs, parent) {
      const elm = document.createElement(tag);
      if (attrs) {
        isString(attrs) ? addClass(elm, attrs) : setAttribute(elm, attrs);
      }
      parent && append(parent, elm);
      return elm;
    }

    function style(elm, prop, value) {
      if (isUndefined(value)) {
        return getComputedStyle(elm)[prop];
      }
      if (!isNull(value)) {
        const { style: style2 } = elm;
        value = `${value}`;
        if (style2[prop] !== value) {
          style2[prop] = value;
        }
      }
    }

    function display(elm, display2) {
      style(elm, "display", display2);
    }

    function focus(elm) {
      elm["setActive"] && elm["setActive"]() || elm.focus({ preventScroll: true });
    }

    function getAttribute(elm, attr) {
      return elm.getAttribute(attr);
    }

    function hasClass(elm, className) {
      return elm && elm.classList.contains(className);
    }

    function rect(target) {
      return target.getBoundingClientRect();
    }

    function remove(nodes) {
      forEach(nodes, (node) => {
        if (node && node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
    }

    function measure(parent, value) {
      if (isString(value)) {
        const div = create("div", { style: `width: ${value}; position: absolute;` }, parent);
        value = rect(div).width;
        remove(div);
      }
      return value;
    }

    function parseHtml(html) {
      return child(new DOMParser().parseFromString(html, "text/html").body);
    }

    function prevent(e, stopPropagation) {
      e.preventDefault();
      if (stopPropagation) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }

    function query(parent, selector) {
      return parent && parent.querySelector(selector);
    }

    function queryAll(parent, selector) {
      return slice(parent.querySelectorAll(selector));
    }

    function removeClass(elm, classes) {
      toggleClass(elm, classes, false);
    }

    function unit(value) {
      return isString(value) ? value : value ? `${value}px` : "";
    }

    function assert(condition, message = "") {
      if (!condition) {
        throw new Error(`[${PROJECT_CODE}] ${message}`);
      }
    }

    function nextTick(callback) {
      setTimeout(callback);
    }

    const noop = () => {
    };

    function raf(func) {
      return requestAnimationFrame(func);
    }

    const { min, max, floor, ceil, abs } = Math;

    function approximatelyEqual(x, y, epsilon) {
      return abs(x - y) < epsilon;
    }

    function between(number, minOrMax, maxOrMin, exclusive) {
      const minimum = min(minOrMax, maxOrMin);
      const maximum = max(minOrMax, maxOrMin);
      return exclusive ? minimum < number && number < maximum : minimum <= number && number <= maximum;
    }

    function clamp(number, x, y) {
      const minimum = min(x, y);
      const maximum = max(x, y);
      return min(max(minimum, number), maximum);
    }

    function sign(x) {
      return +(x > 0) - +(x < 0);
    }

    function format(string, replacements) {
      forEach(replacements, (replacement) => {
        string = string.replace("%s", `${replacement}`);
      });
      return string;
    }

    function pad(number) {
      return number < 10 ? `0${number}` : `${number}`;
    }

    const ids = {};
    function uniqueId(prefix) {
      return `${prefix}${pad(ids[prefix] = (ids[prefix] || 0) + 1)}`;
    }

    function EventBus() {
      let handlers = {};
      function on(events, callback, key, priority = DEFAULT_EVENT_PRIORITY) {
        forEachEvent(events, (event, namespace) => {
          handlers[event] = handlers[event] || [];
          push(handlers[event], {
            _event: event,
            _callback: callback,
            _namespace: namespace,
            _priority: priority,
            _key: key
          }).sort((handler1, handler2) => handler1._priority - handler2._priority);
        });
      }
      function off(events, key) {
        forEachEvent(events, (event, namespace) => {
          const eventHandlers = handlers[event];
          handlers[event] = eventHandlers && eventHandlers.filter((handler) => {
            return handler._key ? handler._key !== key : key || handler._namespace !== namespace;
          });
        });
      }
      function offBy(key) {
        forOwn(handlers, (eventHandlers, event) => {
          off(event, key);
        });
      }
      function emit(event) {
        (handlers[event] || []).forEach((handler) => {
          handler._callback.apply(handler, slice(arguments, 1));
        });
      }
      function destroy() {
        handlers = {};
      }
      function forEachEvent(events, iteratee) {
        toArray(events).join(" ").split(" ").forEach((eventNS) => {
          const fragments = eventNS.split(".");
          iteratee(fragments[0], fragments[1]);
        });
      }
      return {
        on,
        off,
        offBy,
        emit,
        destroy
      };
    }

    const EVENT_MOUNTED = "mounted";
    const EVENT_READY = "ready";
    const EVENT_MOVE = "move";
    const EVENT_MOVED = "moved";
    const EVENT_SHIFTED = "shifted";
    const EVENT_CLICK = "click";
    const EVENT_ACTIVE = "active";
    const EVENT_INACTIVE = "inactive";
    const EVENT_VISIBLE = "visible";
    const EVENT_HIDDEN = "hidden";
    const EVENT_SLIDE_KEYDOWN = "slide:keydown";
    const EVENT_REFRESH = "refresh";
    const EVENT_UPDATED = "updated";
    const EVENT_RESIZE = "resize";
    const EVENT_RESIZED = "resized";
    const EVENT_REPOSITIONED = "repositioned";
    const EVENT_DRAG = "drag";
    const EVENT_DRAGGING = "dragging";
    const EVENT_DRAGGED = "dragged";
    const EVENT_SCROLL = "scroll";
    const EVENT_SCROLLED = "scrolled";
    const EVENT_DESTROY = "destroy";
    const EVENT_ARROWS_MOUNTED = "arrows:mounted";
    const EVENT_ARROWS_UPDATED = "arrows:updated";
    const EVENT_PAGINATION_MOUNTED = "pagination:mounted";
    const EVENT_PAGINATION_UPDATED = "pagination:updated";
    const EVENT_NAVIGATION_MOUNTED = "navigation:mounted";
    const EVENT_AUTOPLAY_PLAY = "autoplay:play";
    const EVENT_AUTOPLAY_PLAYING = "autoplay:playing";
    const EVENT_AUTOPLAY_PAUSE = "autoplay:pause";
    const EVENT_LAZYLOAD_LOADED = "lazyload:loaded";

    function EventInterface(Splide2) {
      const { event } = Splide2;
      const key = {};
      let listeners = [];
      function on(events, callback, priority) {
        event.on(events, callback, key, priority);
      }
      function off(events) {
        event.off(events, key);
      }
      function bind(targets, events, callback, options) {
        forEachEvent(targets, events, (target, event2) => {
          listeners.push([target, event2, callback, options]);
          target.addEventListener(event2, callback, options);
        });
      }
      function unbind(targets, events, callback) {
        forEachEvent(targets, events, (target, event2) => {
          listeners = listeners.filter((listener) => {
            if (listener[0] === target && listener[1] === event2 && (!callback || listener[2] === callback)) {
              target.removeEventListener(event2, listener[2], listener[3]);
              return false;
            }
            return true;
          });
        });
      }
      function forEachEvent(targets, events, iteratee) {
        forEach(targets, (target) => {
          if (target) {
            events.split(" ").forEach(iteratee.bind(null, target));
          }
        });
      }
      function destroy() {
        listeners = listeners.filter((data) => unbind(data[0], data[1]));
        event.offBy(key);
      }
      event.on(EVENT_DESTROY, destroy, key);
      return {
        on,
        off,
        emit: event.emit,
        bind,
        unbind,
        destroy
      };
    }

    function RequestInterval(interval, onInterval, onUpdate, limit) {
      const { now } = Date;
      let startTime;
      let rate = 0;
      let id;
      let paused = true;
      let count = 0;
      function update() {
        if (!paused) {
          const elapsed = now() - startTime;
          if (elapsed >= interval) {
            rate = 1;
            startTime = now();
          } else {
            rate = elapsed / interval;
          }
          if (onUpdate) {
            onUpdate(rate);
          }
          if (rate === 1) {
            onInterval();
            if (limit && ++count >= limit) {
              return pause();
            }
          }
          raf(update);
        }
      }
      function start(resume) {
        !resume && cancel();
        startTime = now() - (resume ? rate * interval : 0);
        paused = false;
        raf(update);
      }
      function pause() {
        paused = true;
      }
      function rewind() {
        startTime = now();
        rate = 0;
        if (onUpdate) {
          onUpdate(rate);
        }
      }
      function cancel() {
        cancelAnimationFrame(id);
        rate = 0;
        id = 0;
        paused = true;
      }
      function set(time) {
        interval = time;
      }
      function isPaused() {
        return paused;
      }
      return {
        start,
        rewind,
        pause,
        cancel,
        set,
        isPaused
      };
    }

    function State(initialState) {
      let state = initialState;
      function set(value) {
        state = value;
      }
      function is(states) {
        return includes(toArray(states), state);
      }
      return { set, is };
    }

    function Throttle(func, duration) {
      let interval;
      function throttled() {
        if (!interval) {
          interval = RequestInterval(duration || 0, () => {
            func.apply(this, arguments);
            interval = null;
          }, null, 1);
          interval.start();
        }
      }
      return throttled;
    }

    function Options(Splide2, Components2, options) {
      const throttledObserve = Throttle(observe);
      let initialOptions;
      let points;
      let currPoint;
      function setup() {
        try {
          merge(options, JSON.parse(getAttribute(Splide2.root, DATA_ATTRIBUTE)));
        } catch (e) {
          assert(false, e.message);
        }
        initialOptions = merge({}, options);
        const { breakpoints } = options;
        if (breakpoints) {
          const isMin = options.mediaQuery === "min";
          points = Object.keys(breakpoints).sort((n, m) => isMin ? +m - +n : +n - +m).map((point) => [
            point,
            matchMedia(`(${isMin ? "min" : "max"}-width:${point}px)`)
          ]);
          observe();
        }
      }
      function mount() {
        if (points) {
          addEventListener("resize", throttledObserve);
        }
      }
      function destroy(completely) {
        if (completely) {
          removeEventListener("resize", throttledObserve);
        }
      }
      function observe() {
        const item = find(points, (item2) => item2[1].matches) || [];
        if (item[0] !== currPoint) {
          onMatch(currPoint = item[0]);
        }
      }
      function onMatch(point) {
        const newOptions = options.breakpoints[point] || initialOptions;
        if (newOptions.destroy) {
          Splide2.options = initialOptions;
          Splide2.destroy(newOptions.destroy === "completely");
        } else {
          if (Splide2.state.is(DESTROYED)) {
            destroy(true);
            Splide2.mount();
          }
          Splide2.options = newOptions;
        }
      }
      return {
        setup,
        mount,
        destroy
      };
    }

    const RTL = "rtl";
    const TTB = "ttb";

    const ORIENTATION_MAP = {
      marginRight: ["marginBottom", "marginLeft"],
      autoWidth: ["autoHeight"],
      fixedWidth: ["fixedHeight"],
      paddingLeft: ["paddingTop", "paddingRight"],
      paddingRight: ["paddingBottom", "paddingLeft"],
      width: ["height"],
      left: ["top", "right"],
      right: ["bottom", "left"],
      x: ["y"],
      X: ["Y"],
      Y: ["X"],
      ArrowLeft: ["ArrowUp", "ArrowRight"],
      ArrowRight: ["ArrowDown", "ArrowLeft"]
    };
    function Direction(Splide2, Components2, options) {
      function resolve(prop, axisOnly) {
        const { direction } = options;
        const index = direction === RTL && !axisOnly ? 1 : direction === TTB ? 0 : -1;
        return ORIENTATION_MAP[prop][index] || prop;
      }
      function orient(value) {
        return value * (options.direction === RTL ? 1 : -1);
      }
      return {
        resolve,
        orient
      };
    }

    const CLASS_ROOT = PROJECT_CODE;
    const CLASS_SLIDER = `${PROJECT_CODE}__slider`;
    const CLASS_TRACK = `${PROJECT_CODE}__track`;
    const CLASS_LIST = `${PROJECT_CODE}__list`;
    const CLASS_SLIDE = `${PROJECT_CODE}__slide`;
    const CLASS_CLONE = `${CLASS_SLIDE}--clone`;
    const CLASS_CONTAINER = `${CLASS_SLIDE}__container`;
    const CLASS_ARROWS = `${PROJECT_CODE}__arrows`;
    const CLASS_ARROW = `${PROJECT_CODE}__arrow`;
    const CLASS_ARROW_PREV = `${CLASS_ARROW}--prev`;
    const CLASS_ARROW_NEXT = `${CLASS_ARROW}--next`;
    const CLASS_PAGINATION = `${PROJECT_CODE}__pagination`;
    const CLASS_PAGINATION_PAGE = `${CLASS_PAGINATION}__page`;
    const CLASS_PROGRESS = `${PROJECT_CODE}__progress`;
    const CLASS_PROGRESS_BAR = `${CLASS_PROGRESS}__bar`;
    const CLASS_AUTOPLAY = `${PROJECT_CODE}__autoplay`;
    const CLASS_PLAY = `${PROJECT_CODE}__play`;
    const CLASS_PAUSE = `${PROJECT_CODE}__pause`;
    const CLASS_SPINNER = `${PROJECT_CODE}__spinner`;
    const CLASS_INITIALIZED = "is-initialized";
    const CLASS_ACTIVE = "is-active";
    const CLASS_PREV = "is-prev";
    const CLASS_NEXT = "is-next";
    const CLASS_VISIBLE = "is-visible";
    const CLASS_LOADING = "is-loading";
    const STATUS_CLASSES = [CLASS_ACTIVE, CLASS_VISIBLE, CLASS_PREV, CLASS_NEXT, CLASS_LOADING];
    const CLASSES = {
      slide: CLASS_SLIDE,
      clone: CLASS_CLONE,
      arrows: CLASS_ARROWS,
      arrow: CLASS_ARROW,
      prev: CLASS_ARROW_PREV,
      next: CLASS_ARROW_NEXT,
      pagination: CLASS_PAGINATION,
      page: CLASS_PAGINATION_PAGE,
      spinner: CLASS_SPINNER
    };

    function Elements(Splide2, Components2, options) {
      const { on } = EventInterface(Splide2);
      const { root } = Splide2;
      const elements = {};
      const slides = [];
      let classes;
      let slider;
      let track;
      let list;
      function setup() {
        collect();
        identify();
        addClass(root, classes = getClasses());
      }
      function mount() {
        on(EVENT_REFRESH, refresh, DEFAULT_EVENT_PRIORITY - 2);
        on(EVENT_UPDATED, update);
      }
      function destroy() {
        [root, track, list].forEach((elm) => {
          removeAttribute(elm, "style");
        });
        empty(slides);
        removeClass(root, classes);
      }
      function refresh() {
        destroy();
        setup();
      }
      function update() {
        removeClass(root, classes);
        addClass(root, classes = getClasses());
      }
      function collect() {
        slider = child(root, `.${CLASS_SLIDER}`);
        track = query(root, `.${CLASS_TRACK}`);
        list = child(track, `.${CLASS_LIST}`);
        assert(track && list, "A track/list element is missing.");
        push(slides, children(list, `.${CLASS_SLIDE}:not(.${CLASS_CLONE})`));
        const autoplay = find(`.${CLASS_AUTOPLAY}`);
        const arrows = find(`.${CLASS_ARROWS}`);
        assign(elements, {
          root,
          slider,
          track,
          list,
          slides,
          arrows,
          autoplay,
          prev: query(arrows, `.${CLASS_ARROW_PREV}`),
          next: query(arrows, `.${CLASS_ARROW_NEXT}`),
          bar: query(find(`.${CLASS_PROGRESS}`), `.${CLASS_PROGRESS_BAR}`),
          play: query(autoplay, `.${CLASS_PLAY}`),
          pause: query(autoplay, `.${CLASS_PAUSE}`)
        });
      }
      function identify() {
        const id = root.id || uniqueId(PROJECT_CODE);
        root.id = id;
        track.id = track.id || `${id}-track`;
        list.id = list.id || `${id}-list`;
      }
      function find(selector) {
        return child(root, selector) || child(slider, selector);
      }
      function getClasses() {
        return [
          `${CLASS_ROOT}--${options.type}`,
          `${CLASS_ROOT}--${options.direction}`,
          options.drag && `${CLASS_ROOT}--draggable`,
          options.isNavigation && `${CLASS_ROOT}--nav`,
          CLASS_ACTIVE
        ];
      }
      return assign(elements, {
        setup,
        mount,
        destroy
      });
    }

    const ROLE = "role";
    const ARIA_CONTROLS = "aria-controls";
    const ARIA_CURRENT = "aria-current";
    const ARIA_LABEL = "aria-label";
    const ARIA_HIDDEN = "aria-hidden";
    const TAB_INDEX = "tabindex";
    const DISABLED = "disabled";
    const ARIA_ORIENTATION = "aria-orientation";
    const ALL_ATTRIBUTES = [
      ROLE,
      ARIA_CONTROLS,
      ARIA_CURRENT,
      ARIA_LABEL,
      ARIA_HIDDEN,
      ARIA_ORIENTATION,
      TAB_INDEX,
      DISABLED
    ];

    const SLIDE = "slide";
    const LOOP = "loop";
    const FADE = "fade";

    function Slide$1(Splide2, index, slideIndex, slide) {
      const { on, emit, bind, destroy: destroyEvents } = EventInterface(Splide2);
      const { Components, root, options } = Splide2;
      const { isNavigation, updateOnMove } = options;
      const { resolve } = Components.Direction;
      const styles = getAttribute(slide, "style");
      const isClone = slideIndex > -1;
      const container = child(slide, `.${CLASS_CONTAINER}`);
      const focusableNodes = options.focusableNodes && queryAll(slide, options.focusableNodes);
      let destroyed;
      function mount() {
        if (!isClone) {
          slide.id = `${root.id}-slide${pad(index + 1)}`;
        }
        bind(slide, "click keydown", (e) => {
          emit(e.type === "click" ? EVENT_CLICK : EVENT_SLIDE_KEYDOWN, self, e);
        });
        on([EVENT_REFRESH, EVENT_REPOSITIONED, EVENT_SHIFTED, EVENT_MOVED, EVENT_SCROLLED], update);
        on(EVENT_NAVIGATION_MOUNTED, initNavigation);
        if (updateOnMove) {
          on(EVENT_MOVE, onMove);
        }
      }
      function destroy() {
        destroyed = true;
        destroyEvents();
        removeClass(slide, STATUS_CLASSES);
        removeAttribute(slide, ALL_ATTRIBUTES);
        setAttribute(slide, "style", styles);
      }
      function initNavigation() {
        const idx = isClone ? slideIndex : index;
        const label = format(options.i18n.slideX, idx + 1);
        const controls = Splide2.splides.map((target) => target.splide.root.id).join(" ");
        setAttribute(slide, ARIA_LABEL, label);
        setAttribute(slide, ARIA_CONTROLS, controls);
        setAttribute(slide, ROLE, "menuitem");
        updateActivity(isActive());
      }
      function onMove() {
        if (!destroyed) {
          update();
        }
      }
      function update() {
        if (!destroyed) {
          const { index: currIndex } = Splide2;
          updateActivity(isActive());
          updateVisibility(isVisible());
          toggleClass(slide, CLASS_PREV, index === currIndex - 1);
          toggleClass(slide, CLASS_NEXT, index === currIndex + 1);
        }
      }
      function updateActivity(active) {
        if (active !== hasClass(slide, CLASS_ACTIVE)) {
          toggleClass(slide, CLASS_ACTIVE, active);
          if (isNavigation) {
            setAttribute(slide, ARIA_CURRENT, active || null);
          }
          emit(active ? EVENT_ACTIVE : EVENT_INACTIVE, self);
        }
      }
      function updateVisibility(visible) {
        const hidden = !visible && (!isActive() || isClone);
        setAttribute(slide, ARIA_HIDDEN, hidden || null);
        setAttribute(slide, TAB_INDEX, !hidden && options.slideFocus ? 0 : null);
        if (focusableNodes) {
          focusableNodes.forEach((node) => {
            setAttribute(node, TAB_INDEX, hidden ? -1 : null);
          });
        }
        if (visible !== hasClass(slide, CLASS_VISIBLE)) {
          toggleClass(slide, CLASS_VISIBLE, visible);
          emit(visible ? EVENT_VISIBLE : EVENT_HIDDEN, self);
        }
      }
      function style$1(prop, value, useContainer) {
        style(useContainer && container || slide, prop, value);
      }
      function isActive() {
        const { index: curr } = Splide2;
        return curr === index || options.cloneStatus && curr === slideIndex;
      }
      function isVisible() {
        if (Splide2.is(FADE)) {
          return isActive();
        }
        const trackRect = rect(Components.Elements.track);
        const slideRect = rect(slide);
        const left = resolve("left");
        const right = resolve("right");
        return floor(trackRect[left]) <= ceil(slideRect[left]) && floor(slideRect[right]) <= ceil(trackRect[right]);
      }
      function isWithin(from, distance) {
        let diff = abs(from - index);
        if (!isClone && (options.rewind || Splide2.is(LOOP))) {
          diff = min(diff, Splide2.length - diff);
        }
        return diff <= distance;
      }
      const self = {
        index,
        slideIndex,
        slide,
        container,
        isClone,
        mount,
        destroy,
        update,
        style: style$1,
        isWithin
      };
      return self;
    }

    function Slides(Splide2, Components2, options) {
      const { on, emit, bind } = EventInterface(Splide2);
      const { slides, list } = Components2.Elements;
      const Slides2 = [];
      function mount() {
        init();
        on(EVENT_REFRESH, refresh);
        on([EVENT_MOUNTED, EVENT_REFRESH], () => {
          Slides2.sort((Slide1, Slide2) => Slide1.index - Slide2.index);
        });
      }
      function init() {
        slides.forEach((slide, index) => {
          register(slide, index, -1);
        });
      }
      function destroy() {
        forEach$1((Slide2) => {
          Slide2.destroy();
        });
        empty(Slides2);
      }
      function refresh() {
        destroy();
        init();
      }
      function update() {
        forEach$1((Slide2) => {
          Slide2.update();
        });
      }
      function register(slide, index, slideIndex) {
        const object = Slide$1(Splide2, index, slideIndex, slide);
        object.mount();
        Slides2.push(object);
      }
      function get(excludeClones) {
        return excludeClones ? filter((Slide2) => !Slide2.isClone) : Slides2;
      }
      function getIn(page) {
        const { Controller } = Components2;
        const index = Controller.toIndex(page);
        const max = Controller.hasFocus() ? 1 : options.perPage;
        return filter((Slide2) => between(Slide2.index, index, index + max - 1));
      }
      function getAt(index) {
        return filter(index)[0];
      }
      function add(items, index) {
        forEach(items, (slide) => {
          if (isString(slide)) {
            slide = parseHtml(slide);
          }
          if (isHTMLElement(slide)) {
            const ref = slides[index];
            ref ? before(slide, ref) : append(list, slide);
            addClass(slide, options.classes.slide);
            observeImages(slide, emit.bind(null, EVENT_RESIZE));
          }
        });
        emit(EVENT_REFRESH);
      }
      function remove$1(matcher) {
        remove(filter(matcher).map((Slide2) => Slide2.slide));
        emit(EVENT_REFRESH);
      }
      function forEach$1(iteratee, excludeClones) {
        get(excludeClones).forEach(iteratee);
      }
      function filter(matcher) {
        return Slides2.filter(isFunction(matcher) ? matcher : (Slide2) => isString(matcher) ? matches(Slide2.slide, matcher) : includes(toArray(matcher), Slide2.index));
      }
      function style(prop, value, useContainer) {
        forEach$1((Slide2) => {
          Slide2.style(prop, value, useContainer);
        });
      }
      function observeImages(elm, callback) {
        const images = queryAll(elm, "img");
        let { length } = images;
        if (length) {
          images.forEach((img) => {
            bind(img, "load error", () => {
              if (!--length) {
                callback();
              }
            });
          });
        } else {
          callback();
        }
      }
      function getLength(excludeClones) {
        return excludeClones ? slides.length : Slides2.length;
      }
      function isEnough() {
        return Slides2.length > options.perPage;
      }
      return {
        mount,
        destroy,
        update,
        register,
        get,
        getIn,
        getAt,
        add,
        remove: remove$1,
        forEach: forEach$1,
        filter,
        style,
        getLength,
        isEnough
      };
    }

    function Layout(Splide2, Components2, options) {
      const { on, bind, emit } = EventInterface(Splide2);
      const { Slides } = Components2;
      const { resolve } = Components2.Direction;
      const { root, track, list } = Components2.Elements;
      const { getAt } = Slides;
      let vertical;
      let rootRect;
      function mount() {
        init();
        bind(window, "resize load", Throttle(emit.bind(this, EVENT_RESIZE)));
        on([EVENT_UPDATED, EVENT_REFRESH], init);
        on(EVENT_RESIZE, resize);
      }
      function init() {
        rootRect = null;
        vertical = options.direction === TTB;
        style(root, "maxWidth", unit(options.width));
        style(track, resolve("paddingLeft"), cssPadding(false));
        style(track, resolve("paddingRight"), cssPadding(true));
        resize();
      }
      function resize() {
        const newRect = rect(root);
        if (!rootRect || rootRect.width !== newRect.width || rootRect.height !== newRect.height) {
          style(track, "height", cssTrackHeight());
          Slides.style(resolve("marginRight"), unit(options.gap));
          Slides.style("width", cssSlideWidth() || null);
          setSlidesHeight();
          rootRect = newRect;
          emit(EVENT_RESIZED);
        }
      }
      function setSlidesHeight() {
        Slides.style("height", cssSlideHeight() || null, true);
      }
      function cssPadding(right) {
        const { padding } = options;
        const prop = resolve(right ? "right" : "left");
        return padding && unit(padding[prop] || (isObject(padding) ? 0 : padding)) || "0px";
      }
      function cssTrackHeight() {
        let height = "";
        if (vertical) {
          height = cssHeight();
          assert(height, "height or heightRatio is missing.");
          height = `calc(${height} - ${cssPadding(false)} - ${cssPadding(true)})`;
        }
        return height;
      }
      function cssHeight() {
        return unit(options.height || rect(list).width * options.heightRatio);
      }
      function cssSlideWidth() {
        return options.autoWidth ? "" : unit(options.fixedWidth) || (vertical ? "" : cssSlideSize());
      }
      function cssSlideHeight() {
        return unit(options.fixedHeight) || (vertical ? options.autoHeight ? "" : cssSlideSize() : cssHeight());
      }
      function cssSlideSize() {
        const gap = unit(options.gap);
        return `calc((100%${gap && ` + ${gap}`})/${options.perPage || 1}${gap && ` - ${gap}`})`;
      }
      function listSize() {
        return rect(list)[resolve("width")];
      }
      function slideSize(index, withoutGap) {
        const Slide = getAt(index || 0);
        return Slide ? rect(Slide.slide)[resolve("width")] + (withoutGap ? 0 : getGap()) : 0;
      }
      function totalSize(index, withoutGap) {
        const Slide = getAt(index);
        if (Slide) {
          const right = rect(Slide.slide)[resolve("right")];
          const left = rect(list)[resolve("left")];
          return abs(right - left) + (withoutGap ? 0 : getGap());
        }
        return 0;
      }
      function sliderSize() {
        return totalSize(Splide2.length - 1, true) - totalSize(-1, true);
      }
      function getGap() {
        const Slide = getAt(0);
        return Slide && parseFloat(style(Slide.slide, resolve("marginRight"))) || 0;
      }
      function getPadding(right) {
        return parseFloat(style(track, resolve(`padding${right ? "Right" : "Left"}`))) || 0;
      }
      return {
        mount,
        listSize,
        slideSize,
        sliderSize,
        totalSize,
        getPadding
      };
    }

    function Clones(Splide2, Components2, options) {
      const { on, emit } = EventInterface(Splide2);
      const { Elements, Slides } = Components2;
      const { resolve } = Components2.Direction;
      const clones = [];
      let cloneCount;
      function mount() {
        init();
        on(EVENT_REFRESH, refresh);
        on([EVENT_UPDATED, EVENT_RESIZE], observe);
      }
      function init() {
        if (cloneCount = computeCloneCount()) {
          generate(cloneCount);
          emit(EVENT_RESIZE);
        }
      }
      function destroy() {
        remove(clones);
        empty(clones);
      }
      function refresh() {
        destroy();
        init();
      }
      function observe() {
        if (cloneCount < computeCloneCount()) {
          emit(EVENT_REFRESH);
        }
      }
      function generate(count) {
        const slides = Slides.get().slice();
        const { length } = slides;
        if (length) {
          while (slides.length < count) {
            push(slides, slides);
          }
          push(slides.slice(-count), slides.slice(0, count)).forEach((Slide, index) => {
            const isHead = index < count;
            const clone = cloneDeep(Slide.slide, index);
            isHead ? before(clone, slides[0].slide) : append(Elements.list, clone);
            push(clones, clone);
            Slides.register(clone, index - count + (isHead ? 0 : length), Slide.index);
          });
        }
      }
      function cloneDeep(elm, index) {
        const clone = elm.cloneNode(true);
        addClass(clone, options.classes.clone);
        clone.id = `${Splide2.root.id}-clone${pad(index + 1)}`;
        return clone;
      }
      function computeCloneCount() {
        let { clones: clones2 } = options;
        if (!Splide2.is(LOOP)) {
          clones2 = 0;
        } else if (!clones2) {
          const fixedSize = measure(Elements.list, options[resolve("fixedWidth")]);
          const fixedCount = fixedSize && ceil(rect(Elements.track)[resolve("width")] / fixedSize);
          const baseCount = fixedCount || options[resolve("autoWidth")] && Splide2.length || options.perPage;
          clones2 = baseCount * (options.drag ? (options.flickMaxPages || 1) + 1 : 2);
        }
        return clones2;
      }
      return {
        mount,
        destroy
      };
    }

    function Move(Splide2, Components2, options) {
      const { on, emit } = EventInterface(Splide2);
      const { slideSize, getPadding, totalSize, listSize, sliderSize } = Components2.Layout;
      const { resolve, orient } = Components2.Direction;
      const { list, track } = Components2.Elements;
      let Transition;
      function mount() {
        Transition = Components2.Transition;
        on([EVENT_MOUNTED, EVENT_RESIZED, EVENT_UPDATED, EVENT_REFRESH], reposition);
      }
      function destroy() {
        removeAttribute(list, "style");
      }
      function reposition() {
        if (!isBusy()) {
          Components2.Scroll.cancel();
          jump(Splide2.index);
          emit(EVENT_REPOSITIONED);
        }
      }
      function move(dest, index, prev, callback) {
        if (!isBusy()) {
          const { set } = Splide2.state;
          const position = getPosition();
          if (dest !== index) {
            Transition.cancel();
            translate(shift(position, dest > index), true);
          }
          set(MOVING);
          emit(EVENT_MOVE, index, prev, dest);
          Transition.start(index, () => {
            set(IDLE);
            emit(EVENT_MOVED, index, prev, dest);
            if (options.trimSpace === "move" && dest !== prev && position === getPosition()) {
              Components2.Controller.go(dest > prev ? ">" : "<", false, callback);
            } else {
              callback && callback();
            }
          });
        }
      }
      function jump(index) {
        translate(toPosition(index, true));
      }
      function translate(position, preventLoop) {
        if (!Splide2.is(FADE)) {
          const destination = preventLoop ? position : loop(position);
          list.style.transform = `translate${resolve("X")}(${destination}px)`;
          position !== destination && emit(EVENT_SHIFTED);
        }
      }
      function loop(position) {
        if (Splide2.is(LOOP)) {
          const diff = orient(position - getPosition());
          const exceededMin = exceededLimit(false, position) && diff < 0;
          const exceededMax = exceededLimit(true, position) && diff > 0;
          if (exceededMin || exceededMax) {
            position = shift(position, exceededMax);
          }
        }
        return position;
      }
      function shift(position, backwards) {
        const excess = position - getLimit(backwards);
        const size = sliderSize();
        position -= orient(size * (ceil(abs(excess) / size) || 1)) * (backwards ? 1 : -1);
        return position;
      }
      function cancel() {
        translate(getPosition());
        Transition.cancel();
      }
      function toIndex(position) {
        const Slides = Components2.Slides.get();
        let index = 0;
        let minDistance = Infinity;
        for (let i = 0; i < Slides.length; i++) {
          const slideIndex = Slides[i].index;
          const distance = abs(toPosition(slideIndex, true) - position);
          if (distance <= minDistance) {
            minDistance = distance;
            index = slideIndex;
          } else {
            break;
          }
        }
        return index;
      }
      function toPosition(index, trimming) {
        const position = orient(totalSize(index - 1) - offset(index));
        return trimming ? trim(position) : position;
      }
      function getPosition() {
        const left = resolve("left");
        return rect(list)[left] - rect(track)[left] + orient(getPadding(false));
      }
      function trim(position) {
        if (options.trimSpace && Splide2.is(SLIDE)) {
          position = clamp(position, 0, orient(sliderSize() - listSize()));
        }
        return position;
      }
      function offset(index) {
        const { focus } = options;
        return focus === "center" ? (listSize() - slideSize(index, true)) / 2 : +focus * slideSize(index) || 0;
      }
      function getLimit(max) {
        return toPosition(max ? Components2.Controller.getEnd() : 0, !!options.trimSpace);
      }
      function isBusy() {
        return Splide2.state.is(MOVING) && options.waitForTransition;
      }
      function exceededLimit(max, position) {
        position = isUndefined(position) ? getPosition() : position;
        const exceededMin = max !== true && orient(position) < orient(getLimit(false));
        const exceededMax = max !== false && orient(position) > orient(getLimit(true));
        return exceededMin || exceededMax;
      }
      return {
        mount,
        destroy,
        move,
        jump,
        translate,
        shift,
        cancel,
        toIndex,
        toPosition,
        getPosition,
        getLimit,
        isBusy,
        exceededLimit
      };
    }

    function Controller(Splide2, Components2, options) {
      const { on } = EventInterface(Splide2);
      const { Move } = Components2;
      const { getPosition, getLimit } = Move;
      const { isEnough, getLength } = Components2.Slides;
      const isLoop = Splide2.is(LOOP);
      const isSlide = Splide2.is(SLIDE);
      let currIndex = options.start || 0;
      let prevIndex = currIndex;
      let slideCount;
      let perMove;
      let perPage;
      function mount() {
        init();
        on([EVENT_UPDATED, EVENT_REFRESH], init, DEFAULT_EVENT_PRIORITY - 1);
      }
      function init() {
        slideCount = getLength(true);
        perMove = options.perMove;
        perPage = options.perPage;
        currIndex = clamp(currIndex, 0, slideCount - 1);
      }
      function go(control, allowSameIndex, callback) {
        const dest = parse(control);
        if (options.useScroll) {
          scroll(dest, true, true, options.speed, callback);
        } else {
          const index = loop(dest);
          if (index > -1 && !Move.isBusy() && (allowSameIndex || index !== currIndex)) {
            setIndex(index);
            Move.move(dest, index, prevIndex, callback);
          }
        }
      }
      function scroll(destination, useIndex, snap, duration, callback) {
        const dest = useIndex ? destination : toDest(destination);
        Components2.Scroll.scroll(useIndex || snap ? Move.toPosition(dest, true) : destination, duration, () => {
          setIndex(Move.toIndex(Move.getPosition()));
          callback && callback();
        });
      }
      function parse(control) {
        let index = currIndex;
        if (isString(control)) {
          const [, indicator, number] = control.match(/([+\-<>])(\d+)?/) || [];
          if (indicator === "+" || indicator === "-") {
            index = computeDestIndex(currIndex + +`${indicator}${+number || 1}`, currIndex, true);
          } else if (indicator === ">") {
            index = number ? toIndex(+number) : getNext(true);
          } else if (indicator === "<") {
            index = getPrev(true);
          }
        } else {
          index = isLoop ? control : clamp(control, 0, getEnd());
        }
        return index;
      }
      function getNext(destination) {
        return getAdjacent(false, destination);
      }
      function getPrev(destination) {
        return getAdjacent(true, destination);
      }
      function getAdjacent(prev, destination) {
        const number = perMove || (hasFocus() ? 1 : perPage);
        const dest = computeDestIndex(currIndex + number * (prev ? -1 : 1), currIndex);
        if (dest === -1 && isSlide) {
          if (!approximatelyEqual(getPosition(), getLimit(!prev), 1)) {
            return prev ? 0 : getEnd();
          }
        }
        return destination ? dest : loop(dest);
      }
      function computeDestIndex(dest, from, incremental) {
        if (isEnough()) {
          const end = getEnd();
          if (dest < 0 || dest > end) {
            if (between(0, dest, from, true) || between(end, from, dest, true)) {
              dest = toIndex(toPage(dest));
            } else {
              if (isLoop) {
                dest = perMove || hasFocus() ? dest : dest < 0 ? -(slideCount % perPage || perPage) : slideCount;
              } else if (options.rewind) {
                dest = dest < 0 ? end : 0;
              } else {
                dest = -1;
              }
            }
          } else {
            if (!incremental && dest !== from) {
              dest = perMove ? dest : toIndex(toPage(from) + (dest < from ? -1 : 1));
            }
          }
        } else {
          dest = -1;
        }
        return dest;
      }
      function getEnd() {
        let end = slideCount - perPage;
        if (hasFocus() || isLoop && perMove) {
          end = slideCount - 1;
        }
        return max(end, 0);
      }
      function loop(index) {
        if (isLoop) {
          return isEnough() ? index % slideCount + (index < 0 ? slideCount : 0) : -1;
        }
        return index;
      }
      function toIndex(page) {
        return clamp(hasFocus() ? page : perPage * page, 0, getEnd());
      }
      function toPage(index) {
        if (!hasFocus()) {
          index = between(index, slideCount - perPage, slideCount - 1) ? slideCount - 1 : index;
          index = floor(index / perPage);
        }
        return index;
      }
      function toDest(destination) {
        const closest = Move.toIndex(destination);
        return isSlide ? clamp(closest, 0, getEnd()) : closest;
      }
      function setIndex(index) {
        if (index !== currIndex) {
          prevIndex = currIndex;
          currIndex = index;
        }
      }
      function getIndex(prev) {
        return prev ? prevIndex : currIndex;
      }
      function hasFocus() {
        return !isUndefined(options.focus) || options.isNavigation;
      }
      return {
        mount,
        go,
        scroll,
        getNext,
        getPrev,
        getAdjacent,
        getEnd,
        setIndex,
        getIndex,
        toIndex,
        toPage,
        toDest,
        hasFocus
      };
    }

    const XML_NAME_SPACE = "http://www.w3.org/2000/svg";
    const PATH = "m15.5 0.932-4.3 4.38 14.5 14.6-14.5 14.5 4.3 4.4 14.6-14.6 4.4-4.3-4.4-4.4-14.6-14.6z";
    const SIZE = 40;

    function Arrows(Splide2, Components2, options) {
      const { on, bind, emit } = EventInterface(Splide2);
      const { classes, i18n } = options;
      const { Elements, Controller } = Components2;
      let wrapper = Elements.arrows;
      let prev = Elements.prev;
      let next = Elements.next;
      let created;
      const arrows = {};
      function mount() {
        init();
        on(EVENT_UPDATED, init);
      }
      function init() {
        if (options.arrows) {
          if (!prev || !next) {
            createArrows();
          }
        }
        if (prev && next) {
          if (!arrows.prev) {
            const { id } = Elements.track;
            setAttribute(prev, ARIA_CONTROLS, id);
            setAttribute(next, ARIA_CONTROLS, id);
            arrows.prev = prev;
            arrows.next = next;
            listen();
            emit(EVENT_ARROWS_MOUNTED, prev, next);
          } else {
            display(wrapper, options.arrows === false ? "none" : "");
          }
        }
      }
      function destroy() {
        if (created) {
          remove(wrapper);
        } else {
          removeAttribute(prev, ALL_ATTRIBUTES);
          removeAttribute(next, ALL_ATTRIBUTES);
        }
      }
      function listen() {
        const { go } = Controller;
        on([EVENT_MOUNTED, EVENT_MOVED, EVENT_UPDATED, EVENT_REFRESH, EVENT_SCROLLED], update);
        bind(next, "click", () => {
          go(">", true);
        });
        bind(prev, "click", () => {
          go("<", true);
        });
      }
      function createArrows() {
        wrapper = create("div", classes.arrows);
        prev = createArrow(true);
        next = createArrow(false);
        created = true;
        append(wrapper, [prev, next]);
        before(wrapper, child(options.arrows === "slider" && Elements.slider || Splide2.root));
      }
      function createArrow(prev2) {
        const arrow = `<button class="${classes.arrow} ${prev2 ? classes.prev : classes.next}" type="button"><svg xmlns="${XML_NAME_SPACE}" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}"><path d="${options.arrowPath || PATH}" />`;
        return parseHtml(arrow);
      }
      function update() {
        const index = Splide2.index;
        const prevIndex = Controller.getPrev();
        const nextIndex = Controller.getNext();
        const prevLabel = prevIndex > -1 && index < prevIndex ? i18n.last : i18n.prev;
        const nextLabel = nextIndex > -1 && index > nextIndex ? i18n.first : i18n.next;
        prev.disabled = prevIndex < 0;
        next.disabled = nextIndex < 0;
        setAttribute(prev, ARIA_LABEL, prevLabel);
        setAttribute(next, ARIA_LABEL, nextLabel);
        emit(EVENT_ARROWS_UPDATED, prev, next, prevIndex, nextIndex);
      }
      return {
        arrows,
        mount,
        destroy
      };
    }

    const INTERVAL_DATA_ATTRIBUTE = `${DATA_ATTRIBUTE}-interval`;

    function Autoplay(Splide2, Components2, options) {
      const { on, bind, emit } = EventInterface(Splide2);
      const interval = RequestInterval(options.interval, Splide2.go.bind(Splide2, ">"), update);
      const { isPaused } = interval;
      const { Elements } = Components2;
      let hovered;
      let focused;
      let paused;
      function mount() {
        const { autoplay } = options;
        if (autoplay) {
          initButton(true);
          initButton(false);
          listen();
          if (autoplay !== "pause") {
            play();
          }
        }
      }
      function initButton(forPause) {
        const prop = forPause ? "pause" : "play";
        const button = Elements[prop];
        if (button) {
          setAttribute(button, ARIA_CONTROLS, Elements.track.id);
          setAttribute(button, ARIA_LABEL, options.i18n[prop]);
          bind(button, "click", forPause ? pause : play);
        }
      }
      function listen() {
        const { root } = Elements;
        if (options.pauseOnHover) {
          bind(root, "mouseenter mouseleave", (e) => {
            hovered = e.type === "mouseenter";
            autoToggle();
          });
        }
        if (options.pauseOnFocus) {
          bind(root, "focusin focusout", (e) => {
            focused = e.type === "focusin";
            autoToggle();
          });
        }
        on([EVENT_MOVE, EVENT_SCROLL, EVENT_REFRESH], interval.rewind);
        on(EVENT_MOVE, updateInterval);
      }
      function play() {
        if (isPaused() && Components2.Slides.isEnough()) {
          interval.start(!options.resetProgress);
          focused = hovered = paused = false;
          emit(EVENT_AUTOPLAY_PLAY);
        }
      }
      function pause(manual = true) {
        if (!isPaused()) {
          interval.pause();
          emit(EVENT_AUTOPLAY_PAUSE);
        }
        paused = manual;
      }
      function autoToggle() {
        if (!paused) {
          if (!hovered && !focused) {
            play();
          } else {
            pause(false);
          }
        }
      }
      function update(rate) {
        const { bar } = Elements;
        bar && style(bar, "width", `${rate * 100}%`);
        emit(EVENT_AUTOPLAY_PLAYING, rate);
      }
      function updateInterval() {
        const Slide = Components2.Slides.getAt(Splide2.index);
        interval.set(Slide && +getAttribute(Slide.slide, INTERVAL_DATA_ATTRIBUTE) || options.interval);
      }
      return {
        mount,
        destroy: interval.cancel,
        play,
        pause,
        isPaused
      };
    }

    function Cover(Splide2, Components2, options) {
      const { on } = EventInterface(Splide2);
      function mount() {
        if (options.cover) {
          on(EVENT_LAZYLOAD_LOADED, (img, Slide) => {
            toggle(true, img, Slide);
          });
          on([EVENT_MOUNTED, EVENT_UPDATED, EVENT_REFRESH], apply.bind(null, true));
        }
      }
      function destroy() {
        apply(false);
      }
      function apply(cover) {
        Components2.Slides.forEach((Slide) => {
          const img = child(Slide.container || Slide.slide, "img");
          if (img && img.src) {
            toggle(cover, img, Slide);
          }
        });
      }
      function toggle(cover, img, Slide) {
        Slide.style("background", cover ? `center/cover no-repeat url("${img.src}")` : "", true);
        display(img, cover ? "none" : "");
      }
      return {
        mount,
        destroy
      };
    }

    const BOUNCE_DIFF_THRESHOLD = 10;
    const BOUNCE_DURATION = 600;
    const FRICTION_FACTOR = 0.6;
    const BASE_VELOCITY = 1.5;
    const MIN_DURATION = 800;

    function Scroll(Splide2, Components2, options) {
      const { on, emit } = EventInterface(Splide2);
      const { Move } = Components2;
      const { getPosition, getLimit, exceededLimit } = Move;
      let interval;
      let scrollCallback;
      function mount() {
        on(EVENT_MOVE, clear);
        on([EVENT_UPDATED, EVENT_REFRESH], cancel);
      }
      function scroll(destination, duration, callback, suppressConstraint) {
        const start = getPosition();
        let friction = 1;
        duration = duration || computeDuration(abs(destination - start));
        scrollCallback = callback;
        clear();
        interval = RequestInterval(duration, onScrolled, (rate) => {
          const position = getPosition();
          const target = start + (destination - start) * easing(rate);
          const diff = (target - getPosition()) * friction;
          Move.translate(position + diff);
          if (Splide2.is(SLIDE) && !suppressConstraint && exceededLimit()) {
            friction *= FRICTION_FACTOR;
            if (abs(diff) < BOUNCE_DIFF_THRESHOLD) {
              bounce(exceededLimit(false));
            }
          }
        }, 1);
        emit(EVENT_SCROLL);
        interval.start();
      }
      function bounce(backwards) {
        scroll(getLimit(!backwards), BOUNCE_DURATION, null, true);
      }
      function onScrolled() {
        const position = getPosition();
        const index = Move.toIndex(position);
        if (!between(index, 0, Splide2.length - 1)) {
          Move.translate(Move.shift(position, index > 0), true);
        }
        scrollCallback && scrollCallback();
        emit(EVENT_SCROLLED);
      }
      function computeDuration(distance) {
        return max(distance / BASE_VELOCITY, MIN_DURATION);
      }
      function clear() {
        if (interval) {
          interval.cancel();
        }
      }
      function cancel() {
        if (interval && !interval.isPaused()) {
          clear();
          onScrolled();
        }
      }
      function easing(t) {
        const { easingFunc } = options;
        return easingFunc ? easingFunc(t) : 1 - Math.pow(1 - t, 4);
      }
      return {
        mount,
        destroy: clear,
        scroll,
        cancel
      };
    }

    const SCROLL_LISTENER_OPTIONS = { passive: false, capture: true };

    const FRICTION = 5;
    const LOG_INTERVAL = 200;
    const POINTER_DOWN_EVENTS = "touchstart mousedown";
    const POINTER_MOVE_EVENTS = "touchmove mousemove";
    const POINTER_UP_EVENTS = "touchend touchcancel mouseup";

    function Drag(Splide2, Components2, options) {
      const { on, emit, bind, unbind } = EventInterface(Splide2);
      const { Move, Scroll, Controller } = Components2;
      const { track } = Components2.Elements;
      const { resolve, orient } = Components2.Direction;
      const { getPosition, exceededLimit } = Move;
      let basePosition;
      let baseEvent;
      let prevBaseEvent;
      let lastEvent;
      let isFree;
      let dragging;
      let hasExceeded = false;
      let clickPrevented;
      let disabled;
      let target;
      function mount() {
        bind(track, POINTER_MOVE_EVENTS, noop, SCROLL_LISTENER_OPTIONS);
        bind(track, POINTER_UP_EVENTS, noop, SCROLL_LISTENER_OPTIONS);
        bind(track, POINTER_DOWN_EVENTS, onPointerDown, SCROLL_LISTENER_OPTIONS);
        bind(track, "click", onClick, { capture: true });
        bind(track, "dragstart", prevent);
        on([EVENT_MOUNTED, EVENT_UPDATED], init);
      }
      function init() {
        const { drag } = options;
        disable(!drag);
        isFree = drag === "free";
      }
      function onPointerDown(e) {
        if (!disabled) {
          const { noDrag } = options;
          const isTouch = isTouchEvent(e);
          const isDraggable = !noDrag || !matches(e.target, noDrag);
          clickPrevented = false;
          if (isDraggable && (isTouch || !e.button)) {
            if (!Move.isBusy()) {
              target = isTouch ? track : window;
              prevBaseEvent = null;
              lastEvent = null;
              bind(target, POINTER_MOVE_EVENTS, onPointerMove, SCROLL_LISTENER_OPTIONS);
              bind(target, POINTER_UP_EVENTS, onPointerUp, SCROLL_LISTENER_OPTIONS);
              Move.cancel();
              Scroll.cancel();
              save(e);
            } else {
              prevent(e, true);
            }
          }
        }
      }
      function onPointerMove(e) {
        if (!lastEvent) {
          emit(EVENT_DRAG);
        }
        lastEvent = e;
        if (e.cancelable) {
          const diff = coordOf(e) - coordOf(baseEvent);
          if (dragging) {
            Move.translate(basePosition + constrain(diff));
            const expired = timeOf(e) - timeOf(baseEvent) > LOG_INTERVAL;
            const exceeded = hasExceeded !== (hasExceeded = exceededLimit());
            if (expired || exceeded) {
              save(e);
            }
            emit(EVENT_DRAGGING);
            clickPrevented = true;
            prevent(e);
          } else {
            let { dragMinThreshold: thresholds } = options;
            thresholds = isObject(thresholds) ? thresholds : { mouse: 0, touch: +thresholds || 10 };
            dragging = abs(diff) > (isTouchEvent(e) ? thresholds.touch : thresholds.mouse);
            if (isSliderDirection()) {
              prevent(e);
            }
          }
        }
      }
      function onPointerUp(e) {
        unbind(target, POINTER_MOVE_EVENTS, onPointerMove);
        unbind(target, POINTER_UP_EVENTS, onPointerUp);
        const { index } = Splide2;
        if (lastEvent) {
          if (dragging || e.cancelable && isSliderDirection()) {
            const velocity = computeVelocity(e);
            const destination = computeDestination(velocity);
            if (isFree) {
              Controller.scroll(destination);
            } else if (Splide2.is(FADE)) {
              Controller.go(index + orient(sign(velocity)));
            } else {
              Controller.go(Controller.toDest(destination), true);
            }
            prevent(e);
          }
          emit(EVENT_DRAGGED);
        } else {
          if (!isFree && getPosition() !== Move.toPosition(index)) {
            Controller.go(index, true);
          }
        }
        dragging = false;
      }
      function save(e) {
        prevBaseEvent = baseEvent;
        baseEvent = e;
        basePosition = getPosition();
      }
      function onClick(e) {
        if (!disabled && clickPrevented) {
          prevent(e, true);
        }
      }
      function isSliderDirection() {
        const diffX = abs(coordOf(lastEvent) - coordOf(baseEvent));
        const diffY = abs(coordOf(lastEvent, true) - coordOf(baseEvent, true));
        return diffX > diffY;
      }
      function computeVelocity(e) {
        if (Splide2.is(LOOP) || !hasExceeded) {
          const base = baseEvent === lastEvent && prevBaseEvent || baseEvent;
          const diffCoord = coordOf(lastEvent) - coordOf(base);
          const diffTime = timeOf(e) - timeOf(base);
          const isFlick = timeOf(e) - timeOf(lastEvent) < LOG_INTERVAL;
          if (diffTime && isFlick) {
            return diffCoord / diffTime;
          }
        }
        return 0;
      }
      function computeDestination(velocity) {
        return getPosition() + sign(velocity) * min(abs(velocity) * (options.flickPower || 600), isFree ? Infinity : Components2.Layout.listSize() * (options.flickMaxPages || 1));
      }
      function coordOf(e, orthogonal) {
        return (isTouchEvent(e) ? e.touches[0] : e)[`page${resolve(orthogonal ? "Y" : "X")}`];
      }
      function timeOf(e) {
        return e.timeStamp;
      }
      function constrain(diff) {
        return diff / (hasExceeded && Splide2.is(SLIDE) ? FRICTION : 1);
      }
      function isTouchEvent(e) {
        return typeof TouchEvent !== "undefined" && e instanceof TouchEvent;
      }
      function isDragging() {
        return dragging;
      }
      function disable(value) {
        disabled = value;
      }
      return {
        mount,
        disable,
        isDragging
      };
    }

    const IE_ARROW_KEYS = ["Left", "Right", "Up", "Down"];
    const KEYBOARD_EVENT = "keydown";
    function Keyboard(Splide2, Components2, options) {
      const { on, bind, unbind } = EventInterface(Splide2);
      const { root } = Splide2;
      const { resolve } = Components2.Direction;
      let target;
      let disabled;
      function mount() {
        init();
        on(EVENT_UPDATED, onUpdated);
        on(EVENT_MOVE, onMove);
      }
      function init() {
        const { keyboard } = options;
        if (keyboard) {
          if (keyboard === "focused") {
            target = root;
            setAttribute(root, TAB_INDEX, 0);
          } else {
            target = window;
          }
          bind(target, KEYBOARD_EVENT, onKeydown);
        }
      }
      function destroy() {
        unbind(target, KEYBOARD_EVENT);
        if (isHTMLElement(target)) {
          removeAttribute(target, TAB_INDEX);
        }
      }
      function disable(value) {
        disabled = value;
      }
      function onMove() {
        const _disabled = disabled;
        disabled = true;
        nextTick(() => {
          disabled = _disabled;
        });
      }
      function onUpdated() {
        destroy();
        init();
      }
      function onKeydown(e) {
        if (!disabled) {
          const { key } = e;
          const normalizedKey = includes(IE_ARROW_KEYS, key) ? `Arrow${key}` : key;
          if (normalizedKey === resolve("ArrowLeft")) {
            Splide2.go("<");
          } else if (normalizedKey === resolve("ArrowRight")) {
            Splide2.go(">");
          }
        }
      }
      return {
        mount,
        destroy,
        disable
      };
    }

    const SRC_DATA_ATTRIBUTE = `${DATA_ATTRIBUTE}-lazy`;
    const SRCSET_DATA_ATTRIBUTE = `${SRC_DATA_ATTRIBUTE}-srcset`;
    const IMAGE_SELECTOR = `[${SRC_DATA_ATTRIBUTE}], [${SRCSET_DATA_ATTRIBUTE}]`;

    function LazyLoad(Splide2, Components2, options) {
      const { on, off, bind, emit } = EventInterface(Splide2);
      const isSequential = options.lazyLoad === "sequential";
      let images = [];
      let index = 0;
      function mount() {
        if (options.lazyLoad) {
          init();
          on(EVENT_REFRESH, refresh);
          if (!isSequential) {
            on([EVENT_MOUNTED, EVENT_REFRESH, EVENT_MOVED, EVENT_SCROLLED], observe);
          }
        }
      }
      function refresh() {
        destroy();
        init();
      }
      function init() {
        Components2.Slides.forEach((_Slide) => {
          queryAll(_Slide.slide, IMAGE_SELECTOR).forEach((_img) => {
            const src = getAttribute(_img, SRC_DATA_ATTRIBUTE);
            const srcset = getAttribute(_img, SRCSET_DATA_ATTRIBUTE);
            if (src !== _img.src || srcset !== _img.srcset) {
              const className = options.classes.spinner;
              const parent = _img.parentElement;
              const _spinner = child(parent, `.${className}`) || create("span", className, parent);
              setAttribute(_spinner, ROLE, "presentation");
              images.push({ _img, _Slide, src, srcset, _spinner });
              !_img.src && display(_img, "none");
            }
          });
        });
        if (isSequential) {
          loadNext();
        }
      }
      function destroy() {
        index = 0;
        images = [];
      }
      function observe() {
        images = images.filter((data) => {
          const distance = options.perPage * ((options.preloadPages || 1) + 1) - 1;
          if (data._Slide.isWithin(Splide2.index, distance)) {
            return load(data);
          }
          return true;
        });
        if (!images.length) {
          off(EVENT_MOVED);
        }
      }
      function load(data) {
        const { _img } = data;
        addClass(data._Slide.slide, CLASS_LOADING);
        bind(_img, "load error", (e) => {
          onLoad(data, e.type === "error");
        });
        ["src", "srcset"].forEach((name) => {
          if (data[name]) {
            setAttribute(_img, name, data[name]);
            removeAttribute(_img, name === "src" ? SRC_DATA_ATTRIBUTE : SRCSET_DATA_ATTRIBUTE);
          }
        });
      }
      function onLoad(data, error) {
        const { _Slide } = data;
        removeClass(_Slide.slide, CLASS_LOADING);
        if (!error) {
          remove(data._spinner);
          display(data._img, "");
          emit(EVENT_LAZYLOAD_LOADED, data._img, _Slide);
          emit(EVENT_RESIZE);
        }
        if (isSequential) {
          loadNext();
        }
      }
      function loadNext() {
        if (index < images.length) {
          load(images[index++]);
        }
      }
      return {
        mount,
        destroy
      };
    }

    function Pagination(Splide2, Components2, options) {
      const { on, emit, bind, unbind } = EventInterface(Splide2);
      const { Slides, Elements, Controller } = Components2;
      const { hasFocus, getIndex } = Controller;
      const items = [];
      let list;
      function mount() {
        init();
        on([EVENT_UPDATED, EVENT_REFRESH], init);
        on([EVENT_MOVE, EVENT_SCROLLED], update);
      }
      function init() {
        destroy();
        if (options.pagination && Slides.isEnough()) {
          createPagination();
          emit(EVENT_PAGINATION_MOUNTED, { list, items }, getAt(Splide2.index));
          update();
        }
      }
      function destroy() {
        if (list) {
          remove(list);
          items.forEach((item) => {
            unbind(item.button, "click");
          });
          empty(items);
          list = null;
        }
      }
      function createPagination() {
        const { length } = Splide2;
        const { classes, i18n, perPage } = options;
        const parent = options.pagination === "slider" && Elements.slider || Elements.root;
        const max = hasFocus() ? length : ceil(length / perPage);
        list = create("ul", classes.pagination, parent);
        for (let i = 0; i < max; i++) {
          const li = create("li", null, list);
          const button = create("button", { class: classes.page, type: "button" }, li);
          const controls = Slides.getIn(i).map((Slide) => Slide.slide.id);
          const text = !hasFocus() && perPage > 1 ? i18n.pageX : i18n.slideX;
          bind(button, "click", onClick.bind(null, i));
          setAttribute(button, ARIA_CONTROLS, controls.join(" "));
          setAttribute(button, ARIA_LABEL, format(text, i + 1));
          items.push({ li, button, page: i });
        }
      }
      function onClick(page) {
        Controller.go(`>${page}`, true, () => {
          const Slide = Slides.getAt(Controller.toIndex(page));
          Slide && focus(Slide.slide);
        });
      }
      function getAt(index) {
        return items[Controller.toPage(index)];
      }
      function update() {
        const prev = getAt(getIndex(true));
        const curr = getAt(getIndex());
        if (prev) {
          removeClass(prev.button, CLASS_ACTIVE);
          removeAttribute(prev.button, ARIA_CURRENT);
        }
        if (curr) {
          addClass(curr.button, CLASS_ACTIVE);
          setAttribute(curr.button, ARIA_CURRENT, true);
        }
        emit(EVENT_PAGINATION_UPDATED, { list, items }, prev, curr);
      }
      return {
        items,
        mount,
        destroy,
        getAt,
        update
      };
    }

    const TRIGGER_KEYS = [" ", "Enter", "Spacebar"];
    function Sync(Splide2, Components2, options) {
      const { list } = Components2.Elements;
      const events = [];
      function mount() {
        Splide2.splides.forEach((target) => {
          !target.isParent && sync(target.splide);
        });
        if (options.isNavigation) {
          navigate();
        }
      }
      function destroy() {
        removeAttribute(list, ALL_ATTRIBUTES);
        events.forEach((event) => {
          event.destroy();
        });
        empty(events);
      }
      function remount() {
        destroy();
        mount();
      }
      function sync(splide) {
        [Splide2, splide].forEach((instance) => {
          const event = EventInterface(instance);
          const target = instance === Splide2 ? splide : Splide2;
          event.on(EVENT_MOVE, (index, prev, dest) => {
            target.go(target.is(LOOP) ? dest : index);
          });
          events.push(event);
        });
      }
      function navigate() {
        const event = EventInterface(Splide2);
        const { on } = event;
        on(EVENT_CLICK, onClick);
        on(EVENT_SLIDE_KEYDOWN, onKeydown);
        on([EVENT_MOUNTED, EVENT_UPDATED], update);
        setAttribute(list, ROLE, "menu");
        events.push(event);
        event.emit(EVENT_NAVIGATION_MOUNTED, Splide2.splides);
      }
      function update() {
        setAttribute(list, ARIA_ORIENTATION, options.direction !== TTB ? "horizontal" : null);
      }
      function onClick(Slide) {
        Splide2.go(Slide.index);
      }
      function onKeydown(Slide, e) {
        if (includes(TRIGGER_KEYS, e.key)) {
          onClick(Slide);
          prevent(e);
        }
      }
      return {
        mount,
        destroy,
        remount
      };
    }

    function Wheel(Splide2, Components2, options) {
      const { bind } = EventInterface(Splide2);
      function mount() {
        if (options.wheel) {
          bind(Components2.Elements.track, "wheel", onWheel, SCROLL_LISTENER_OPTIONS);
        }
      }
      function onWheel(e) {
        if (e.cancelable) {
          const { deltaY } = e;
          if (deltaY) {
            const backwards = deltaY < 0;
            Splide2.go(backwards ? "<" : ">");
            shouldPrevent(backwards) && prevent(e);
          }
        }
      }
      function shouldPrevent(backwards) {
        return !options.releaseWheel || Splide2.state.is(MOVING) || Components2.Controller.getAdjacent(backwards) !== -1;
      }
      return {
        mount
      };
    }

    var ComponentConstructors = /*#__PURE__*/Object.freeze({
      __proto__: null,
      Options: Options,
      Direction: Direction,
      Elements: Elements,
      Slides: Slides,
      Layout: Layout,
      Clones: Clones,
      Move: Move,
      Controller: Controller,
      Arrows: Arrows,
      Autoplay: Autoplay,
      Cover: Cover,
      Scroll: Scroll,
      Drag: Drag,
      Keyboard: Keyboard,
      LazyLoad: LazyLoad,
      Pagination: Pagination,
      Sync: Sync,
      Wheel: Wheel
    });

    const I18N = {
      prev: "Previous slide",
      next: "Next slide",
      first: "Go to first slide",
      last: "Go to last slide",
      slideX: "Go to slide %s",
      pageX: "Go to page %s",
      play: "Start autoplay",
      pause: "Pause autoplay"
    };

    const DEFAULTS = {
      type: "slide",
      speed: 400,
      waitForTransition: true,
      perPage: 1,
      cloneStatus: true,
      arrows: true,
      pagination: true,
      interval: 5e3,
      pauseOnHover: true,
      pauseOnFocus: true,
      resetProgress: true,
      keyboard: true,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      drag: true,
      direction: "ltr",
      slideFocus: true,
      trimSpace: true,
      focusableNodes: "a, button, textarea, input, select, iframe",
      classes: CLASSES,
      i18n: I18N
    };

    function Fade(Splide2, Components2, options) {
      const { on } = EventInterface(Splide2);
      function mount() {
        on([EVENT_MOUNTED, EVENT_REFRESH], () => {
          nextTick(() => {
            Components2.Slides.style("transition", `opacity ${options.speed}ms ${options.easing}`);
          });
        });
      }
      function start(index, done) {
        const { track } = Components2.Elements;
        style(track, "height", unit(rect(track).height));
        nextTick(() => {
          done();
          style(track, "height", "");
        });
      }
      return {
        mount,
        start,
        cancel: noop
      };
    }

    function Slide(Splide2, Components2, options) {
      const { bind } = EventInterface(Splide2);
      const { Move, Controller } = Components2;
      const { list } = Components2.Elements;
      let endCallback;
      function mount() {
        bind(list, "transitionend", (e) => {
          if (e.target === list && endCallback) {
            cancel();
            endCallback();
          }
        });
      }
      function start(index, done) {
        const destination = Move.toPosition(index, true);
        const position = Move.getPosition();
        const speed = getSpeed(index);
        if (abs(destination - position) >= 1 && speed >= 1) {
          apply(`transform ${speed}ms ${options.easing}`);
          Move.translate(destination, true);
          endCallback = done;
        } else {
          Move.jump(index);
          done();
        }
      }
      function cancel() {
        apply("");
      }
      function getSpeed(index) {
        const { rewindSpeed } = options;
        if (Splide2.is(SLIDE) && rewindSpeed) {
          const prev = Controller.getIndex(true);
          const end = Controller.getEnd();
          if (prev === 0 && index >= end || prev >= end && index === 0) {
            return rewindSpeed;
          }
        }
        return options.speed;
      }
      function apply(transition) {
        style(list, "transition", transition);
      }
      return {
        mount,
        start,
        cancel
      };
    }

    const _Splide = class {
      constructor(target, options) {
        this.event = EventBus();
        this.Components = {};
        this.state = State(CREATED);
        this.splides = [];
        this._options = {};
        this._Extensions = {};
        const root = isString(target) ? query(document, target) : target;
        assert(root, `${root} is invalid.`);
        this.root = root;
        merge(DEFAULTS, _Splide.defaults);
        merge(merge(this._options, DEFAULTS), options || {});
      }
      mount(Extensions, Transition) {
        const { state, Components: Components2 } = this;
        assert(state.is([CREATED, DESTROYED]), "Already mounted!");
        state.set(CREATED);
        this._Components = Components2;
        this._Transition = Transition || this._Transition || (this.is(FADE) ? Fade : Slide);
        this._Extensions = Extensions || this._Extensions;
        const Constructors = assign({}, ComponentConstructors, this._Extensions, { Transition: this._Transition });
        forOwn(Constructors, (Component, key) => {
          const component = Component(this, Components2, this._options);
          Components2[key] = component;
          component.setup && component.setup();
        });
        forOwn(Components2, (component) => {
          component.mount && component.mount();
        });
        this.emit(EVENT_MOUNTED);
        addClass(this.root, CLASS_INITIALIZED);
        state.set(IDLE);
        this.emit(EVENT_READY);
        return this;
      }
      sync(splide) {
        this.splides.push({ splide });
        splide.splides.push({ splide: this, isParent: true });
        if (this.state.is(IDLE)) {
          this._Components.Sync.remount();
          splide.Components.Sync.remount();
        }
        return this;
      }
      go(control) {
        this._Components.Controller.go(control);
        return this;
      }
      on(events, callback) {
        this.event.on(events, callback, null, DEFAULT_USER_EVENT_PRIORITY);
        return this;
      }
      off(events) {
        this.event.off(events);
        return this;
      }
      emit(event) {
        this.event.emit(event, ...slice(arguments, 1));
        return this;
      }
      add(slides, index) {
        this._Components.Slides.add(slides, index);
        return this;
      }
      remove(matcher) {
        this._Components.Slides.remove(matcher);
        return this;
      }
      is(type) {
        return this._options.type === type;
      }
      refresh() {
        this.emit(EVENT_REFRESH);
        return this;
      }
      destroy(completely = true) {
        const { event, state } = this;
        if (state.is(CREATED)) {
          event.on(EVENT_READY, this.destroy.bind(this, completely), this);
        } else {
          forOwn(this._Components, (component) => {
            component.destroy && component.destroy(completely);
          }, true);
          event.emit(EVENT_DESTROY);
          event.destroy();
          completely && empty(this.splides);
          state.set(DESTROYED);
        }
        return this;
      }
      get options() {
        return this._options;
      }
      set options(options) {
        const { _options } = this;
        merge(_options, options);
        if (!this.state.is(CREATED)) {
          this.emit(EVENT_UPDATED, _options);
        }
      }
      get length() {
        return this._Components.Slides.getLength(true);
      }
      get index() {
        return this._Components.Controller.getIndex();
      }
    };
    let Splide = _Splide;
    Splide.defaults = {};
    Splide.STATES = STATES;

    const EVENTS_WITHOUT_ARGS = [
        EVENT_MOUNTED,
        EVENT_REFRESH,
        EVENT_RESIZE,
        EVENT_RESIZED,
        EVENT_DRAG,
        EVENT_DRAGGING,
        EVENT_DRAGGED,
        EVENT_SCROLL,
        EVENT_SCROLLED,
        EVENT_DESTROY,
        EVENT_AUTOPLAY_PLAY,
        EVENT_AUTOPLAY_PAUSE,
    ];
    /**
     * Binds Splide events to the svelte dispatcher.
     *
     * @since 0.1.0
     *
     * @param splide     - A splide instance.
     * @param dispatchFn - A dispatch function created by `createEventDispatcher()`.
     */
    function bind(splide, dispatchFn) {
        const dispatch = (event, detail = {}) => {
            dispatchFn(transform(event), { splide, ...detail });
        };
        splide.on(EVENT_CLICK, (Slide, e) => {
            dispatch(EVENT_CLICK, { Slide, e });
        });
        splide.on(EVENT_MOVE, (index, prev, dest) => {
            dispatch(EVENT_MOVE, { index, prev, dest });
        });
        splide.on(EVENT_MOVED, (index, prev, dest) => {
            dispatch(EVENT_MOVED, { index, prev, dest });
        });
        splide.on(EVENT_ACTIVE, (Slide) => {
            dispatch(EVENT_ACTIVE, { Slide });
        });
        splide.on(EVENT_INACTIVE, (Slide) => {
            dispatch(EVENT_INACTIVE, { Slide });
        });
        splide.on(EVENT_VISIBLE, (Slide) => {
            dispatch(EVENT_VISIBLE, { Slide });
        });
        splide.on(EVENT_HIDDEN, (Slide) => {
            dispatch(EVENT_HIDDEN, { Slide });
        });
        splide.on(EVENT_UPDATED, (options) => {
            dispatch(EVENT_UPDATED, options);
        });
        splide.on(EVENT_ARROWS_MOUNTED, (prev, next) => {
            dispatch(EVENT_ARROWS_MOUNTED, { prev, next });
        });
        splide.on(EVENT_ARROWS_UPDATED, (prev, next) => {
            dispatch(EVENT_ARROWS_UPDATED, { prev, next });
        });
        splide.on(EVENT_PAGINATION_MOUNTED, (data, item) => {
            dispatch(EVENT_PAGINATION_MOUNTED, { data, item });
        });
        splide.on(EVENT_PAGINATION_UPDATED, (data, prev, curr) => {
            dispatch(EVENT_PAGINATION_UPDATED, { data, prev, curr });
        });
        splide.on(EVENT_NAVIGATION_MOUNTED, (splides) => {
            dispatch(EVENT_NAVIGATION_MOUNTED, { splides });
        });
        splide.on(EVENT_AUTOPLAY_PLAYING, (rate) => {
            dispatch(EVENT_AUTOPLAY_PLAYING, { rate });
        });
        splide.on(EVENT_LAZYLOAD_LOADED, (img, Slide) => {
            dispatch(EVENT_LAZYLOAD_LOADED, { img, Slide });
        });
        EVENTS_WITHOUT_ARGS.forEach(event => {
            splide.on(event, () => {
                dispatch(event);
            });
        });
    }
    /**
     * Transforms Splide event names to the camel case.
     *
     * @since 0.1.0
     *
     * @param event - An event name to transform.
     *
     * @return A transformed event name.
     */
    function transform(event) {
        return event.split(':')
            .map((fragment, index) => {
            return index > 0 ? fragment.charAt(0).toUpperCase() + fragment.slice(1) : fragment;
        })
            .join('')
            .replace('Lazyload', 'LazyLoad');
    }

    /* node_modules/@splidejs/svelte-splide/components/Splide/Splide.svelte generated by Svelte v3.44.3 */
    const file$4 = "node_modules/@splidejs/svelte-splide/components/Splide/Splide.svelte";
    const get_after_slider_slot_changes = dirty => ({});
    const get_after_slider_slot_context = ctx => ({});
    const get_after_track_slot_changes_1 = dirty => ({});
    const get_after_track_slot_context_1 = ctx => ({});
    const get_before_track_slot_changes_1 = dirty => ({});
    const get_before_track_slot_context_1 = ctx => ({});
    const get_after_track_slot_changes = dirty => ({});
    const get_after_track_slot_context = ctx => ({});
    const get_before_track_slot_changes = dirty => ({});
    const get_before_track_slot_context = ctx => ({});
    const get_before_slider_slot_changes = dirty => ({});
    const get_before_slider_slot_context = ctx => ({});

    // (96:2) { #if hasSliderWrapper }
    function create_if_block_2(ctx) {
    	let current;
    	const before_slider_slot_template = /*#slots*/ ctx[12]["before-slider"];
    	const before_slider_slot = create_slot(before_slider_slot_template, ctx, /*$$scope*/ ctx[11], get_before_slider_slot_context);

    	const block = {
    		c: function create() {
    			if (before_slider_slot) before_slider_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (before_slider_slot) {
    				before_slider_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (before_slider_slot) {
    				if (before_slider_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot_base(
    						before_slider_slot,
    						before_slider_slot_template,
    						ctx,
    						/*$$scope*/ ctx[11],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
    						: get_slot_changes(before_slider_slot_template, /*$$scope*/ ctx[11], dirty, get_before_slider_slot_changes),
    						get_before_slider_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(before_slider_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(before_slider_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (before_slider_slot) before_slider_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(96:2) { #if hasSliderWrapper }",
    		ctx
    	});

    	return block;
    }

    // (112:2) { :else }
    function create_else_block(ctx) {
    	let t0;
    	let div;
    	let ul;
    	let t1;
    	let current;
    	const before_track_slot_template = /*#slots*/ ctx[12]["before-track"];
    	const before_track_slot = create_slot(before_track_slot_template, ctx, /*$$scope*/ ctx[11], get_before_track_slot_context_1);
    	const default_slot_template = /*#slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);
    	const after_track_slot_template = /*#slots*/ ctx[12]["after-track"];
    	const after_track_slot = create_slot(after_track_slot_template, ctx, /*$$scope*/ ctx[11], get_after_track_slot_context_1);

    	const block = {
    		c: function create() {
    			if (before_track_slot) before_track_slot.c();
    			t0 = space();
    			div = element("div");
    			ul = element("ul");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (after_track_slot) after_track_slot.c();
    			attr_dev(ul, "class", "splide__list");
    			add_location(ul, file$4, 115, 6, 2855);
    			attr_dev(div, "class", "splide__track");
    			add_location(div, file$4, 114, 4, 2820);
    		},
    		m: function mount(target, anchor) {
    			if (before_track_slot) {
    				before_track_slot.m(target, anchor);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);

    			if (default_slot) {
    				default_slot.m(ul, null);
    			}

    			insert_dev(target, t1, anchor);

    			if (after_track_slot) {
    				after_track_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (before_track_slot) {
    				if (before_track_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot_base(
    						before_track_slot,
    						before_track_slot_template,
    						ctx,
    						/*$$scope*/ ctx[11],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
    						: get_slot_changes(before_track_slot_template, /*$$scope*/ ctx[11], dirty, get_before_track_slot_changes_1),
    						get_before_track_slot_context_1
    					);
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[11],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
    						null
    					);
    				}
    			}

    			if (after_track_slot) {
    				if (after_track_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot_base(
    						after_track_slot,
    						after_track_slot_template,
    						ctx,
    						/*$$scope*/ ctx[11],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
    						: get_slot_changes(after_track_slot_template, /*$$scope*/ ctx[11], dirty, get_after_track_slot_changes_1),
    						get_after_track_slot_context_1
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(before_track_slot, local);
    			transition_in(default_slot, local);
    			transition_in(after_track_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(before_track_slot, local);
    			transition_out(default_slot, local);
    			transition_out(after_track_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (before_track_slot) before_track_slot.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (after_track_slot) after_track_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(112:2) { :else }",
    		ctx
    	});

    	return block;
    }

    // (100:2) { #if hasSliderWrapper }
    function create_if_block_1(ctx) {
    	let div1;
    	let t0;
    	let div0;
    	let ul;
    	let t1;
    	let current;
    	const before_track_slot_template = /*#slots*/ ctx[12]["before-track"];
    	const before_track_slot = create_slot(before_track_slot_template, ctx, /*$$scope*/ ctx[11], get_before_track_slot_context);
    	const default_slot_template = /*#slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);
    	const after_track_slot_template = /*#slots*/ ctx[12]["after-track"];
    	const after_track_slot = create_slot(after_track_slot_template, ctx, /*$$scope*/ ctx[11], get_after_track_slot_context);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (before_track_slot) before_track_slot.c();
    			t0 = space();
    			div0 = element("div");
    			ul = element("ul");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (after_track_slot) after_track_slot.c();
    			attr_dev(ul, "class", "splide__list");
    			add_location(ul, file$4, 104, 8, 2645);
    			attr_dev(div0, "class", "splide__track");
    			add_location(div0, file$4, 103, 6, 2608);
    			attr_dev(div1, "class", "splide__slider");
    			add_location(div1, file$4, 100, 4, 2535);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);

    			if (before_track_slot) {
    				before_track_slot.m(div1, null);
    			}

    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, ul);

    			if (default_slot) {
    				default_slot.m(ul, null);
    			}

    			append_dev(div1, t1);

    			if (after_track_slot) {
    				after_track_slot.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (before_track_slot) {
    				if (before_track_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot_base(
    						before_track_slot,
    						before_track_slot_template,
    						ctx,
    						/*$$scope*/ ctx[11],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
    						: get_slot_changes(before_track_slot_template, /*$$scope*/ ctx[11], dirty, get_before_track_slot_changes),
    						get_before_track_slot_context
    					);
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[11],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
    						null
    					);
    				}
    			}

    			if (after_track_slot) {
    				if (after_track_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot_base(
    						after_track_slot,
    						after_track_slot_template,
    						ctx,
    						/*$$scope*/ ctx[11],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
    						: get_slot_changes(after_track_slot_template, /*$$scope*/ ctx[11], dirty, get_after_track_slot_changes),
    						get_after_track_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(before_track_slot, local);
    			transition_in(default_slot, local);
    			transition_in(after_track_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(before_track_slot, local);
    			transition_out(default_slot, local);
    			transition_out(after_track_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (before_track_slot) before_track_slot.d(detaching);
    			if (default_slot) default_slot.d(detaching);
    			if (after_track_slot) after_track_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(100:2) { #if hasSliderWrapper }",
    		ctx
    	});

    	return block;
    }

    // (124:2) { #if hasSliderWrapper }
    function create_if_block$2(ctx) {
    	let current;
    	const after_slider_slot_template = /*#slots*/ ctx[12]["after-slider"];
    	const after_slider_slot = create_slot(after_slider_slot_template, ctx, /*$$scope*/ ctx[11], get_after_slider_slot_context);

    	const block = {
    		c: function create() {
    			if (after_slider_slot) after_slider_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (after_slider_slot) {
    				after_slider_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (after_slider_slot) {
    				if (after_slider_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot_base(
    						after_slider_slot,
    						after_slider_slot_template,
    						ctx,
    						/*$$scope*/ ctx[11],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
    						: get_slot_changes(after_slider_slot_template, /*$$scope*/ ctx[11], dirty, get_after_slider_slot_changes),
    						get_after_slider_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(after_slider_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(after_slider_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (after_slider_slot) after_slider_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(124:2) { #if hasSliderWrapper }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let t0;
    	let current_block_type_index;
    	let if_block1;
    	let t1;
    	let div_class_value;
    	let current;
    	let if_block0 = /*hasSliderWrapper*/ ctx[1] && create_if_block_2(ctx);
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*hasSliderWrapper*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block2 = /*hasSliderWrapper*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(div, "id", /*id*/ ctx[0]);
    			attr_dev(div, "class", div_class_value = `splide ${/*$$props*/ ctx[3].class || ''}`.trim());
    			add_location(div, file$4, 90, 0, 2332);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if_blocks[current_block_type_index].m(div, null);
    			append_dev(div, t1);
    			if (if_block2) if_block2.m(div, null);
    			/*div_binding*/ ctx[13](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*hasSliderWrapper*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*hasSliderWrapper*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div, t1);
    			}

    			if (/*hasSliderWrapper*/ ctx[1]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*hasSliderWrapper*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*id*/ 1) {
    				attr_dev(div, "id", /*id*/ ctx[0]);
    			}

    			if (!current || dirty & /*$$props*/ 8 && div_class_value !== (div_class_value = `splide ${/*$$props*/ ctx[3].class || ''}`.trim())) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    			if (if_block2) if_block2.d();
    			/*div_binding*/ ctx[13](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Splide', slots, ['before-slider','before-track','default','after-track','after-slider']);
    	let { id = undefined } = $$props;
    	let { options = {} } = $$props;
    	let { splide = undefined } = $$props;
    	let { extensions = undefined } = $$props;
    	let { transition = undefined } = $$props;
    	let { hasSliderWrapper = false } = $$props;

    	/**
     * A dispatcher function.
     * The `createEventDispatcher` type assertion does not accept a type alias.
     * If specified, the svelte kit fails to generate a type of `events` and it will be `CustomEvent<any>`.
     * Also, the svelte action does not provide the way to specify event types.
     */
    	const dispatch = createEventDispatcher();

    	/**
     * The root element.
     */
    	let root;

    	/**
     * Holds the previous slide elements.
     */
    	let prevSlides;

    	/**
     * Holds the previous options.
     */
    	let prevOptions = merge$1({}, options);

    	onMount(() => {
    		$$invalidate(4, splide = new Splide(root, options));
    		bind(splide, dispatch);
    		splide.mount(extensions, transition);
    		prevSlides = getSlides(splide);
    		return () => splide.destroy();
    	});

    	afterUpdate(() => {
    		if (splide) {
    			const newSlides = getSlides(splide);

    			if (!isEqualShallow(prevSlides, newSlides)) {
    				splide.refresh();
    				prevSlides = newSlides.slice();
    			}
    		}
    	});

    	function go(control) {
    		splide?.go(control);
    	}

    	function sync(target) {
    		splide?.sync(target);
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			root = $$value;
    			$$invalidate(2, root);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(3, $$props = assign$1(assign$1({}, $$props), exclude_internal_props($$new_props)));
    		if ('id' in $$new_props) $$invalidate(0, id = $$new_props.id);
    		if ('options' in $$new_props) $$invalidate(5, options = $$new_props.options);
    		if ('splide' in $$new_props) $$invalidate(4, splide = $$new_props.splide);
    		if ('extensions' in $$new_props) $$invalidate(6, extensions = $$new_props.extensions);
    		if ('transition' in $$new_props) $$invalidate(7, transition = $$new_props.transition);
    		if ('hasSliderWrapper' in $$new_props) $$invalidate(1, hasSliderWrapper = $$new_props.hasSliderWrapper);
    		if ('$$scope' in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getSlides,
    		isEqualDeep,
    		isEqualShallow,
    		merge: merge$1,
    		Splide,
    		afterUpdate,
    		createEventDispatcher,
    		onMount,
    		bind,
    		id,
    		options,
    		splide,
    		extensions,
    		transition,
    		hasSliderWrapper,
    		dispatch,
    		root,
    		prevSlides,
    		prevOptions,
    		go,
    		sync
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(3, $$props = assign$1(assign$1({}, $$props), $$new_props));
    		if ('id' in $$props) $$invalidate(0, id = $$new_props.id);
    		if ('options' in $$props) $$invalidate(5, options = $$new_props.options);
    		if ('splide' in $$props) $$invalidate(4, splide = $$new_props.splide);
    		if ('extensions' in $$props) $$invalidate(6, extensions = $$new_props.extensions);
    		if ('transition' in $$props) $$invalidate(7, transition = $$new_props.transition);
    		if ('hasSliderWrapper' in $$props) $$invalidate(1, hasSliderWrapper = $$new_props.hasSliderWrapper);
    		if ('root' in $$props) $$invalidate(2, root = $$new_props.root);
    		if ('prevSlides' in $$props) prevSlides = $$new_props.prevSlides;
    		if ('prevOptions' in $$props) $$invalidate(10, prevOptions = $$new_props.prevOptions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*splide, prevOptions, options*/ 1072) {
    			/**
     * Updates splide options only when they have difference with previous options.
     */
    			if (splide && !isEqualDeep(prevOptions, options)) {
    				$$invalidate(4, splide.options = options, splide);
    				$$invalidate(10, prevOptions = merge$1({}, prevOptions));
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		id,
    		hasSliderWrapper,
    		root,
    		$$props,
    		splide,
    		options,
    		extensions,
    		transition,
    		go,
    		sync,
    		prevOptions,
    		$$scope,
    		slots,
    		div_binding
    	];
    }

    class Splide_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			id: 0,
    			options: 5,
    			splide: 4,
    			extensions: 6,
    			transition: 7,
    			hasSliderWrapper: 1,
    			go: 8,
    			sync: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Splide_1",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get id() {
    		return this.$$.ctx[0];
    	}

    	set id(id) {
    		this.$$set({ id });
    		flush();
    	}

    	get options() {
    		return this.$$.ctx[5];
    	}

    	set options(options) {
    		this.$$set({ options });
    		flush();
    	}

    	get splide() {
    		return this.$$.ctx[4];
    	}

    	set splide(splide) {
    		this.$$set({ splide });
    		flush();
    	}

    	get extensions() {
    		return this.$$.ctx[6];
    	}

    	set extensions(extensions) {
    		this.$$set({ extensions });
    		flush();
    	}

    	get transition() {
    		return this.$$.ctx[7];
    	}

    	set transition(transition) {
    		this.$$set({ transition });
    		flush();
    	}

    	get hasSliderWrapper() {
    		return this.$$.ctx[1];
    	}

    	set hasSliderWrapper(hasSliderWrapper) {
    		this.$$set({ hasSliderWrapper });
    		flush();
    	}

    	get go() {
    		return this.$$.ctx[8];
    	}

    	set go(value) {
    		throw new Error("<Splide>: Cannot set read-only property 'go'");
    	}

    	get sync() {
    		return this.$$.ctx[9];
    	}

    	set sync(value) {
    		throw new Error("<Splide>: Cannot set read-only property 'sync'");
    	}
    }

    /* node_modules/@splidejs/svelte-splide/components/SplideSlide/SplideSlide.svelte generated by Svelte v3.44.3 */

    const file$3 = "node_modules/@splidejs/svelte-splide/components/SplideSlide/SplideSlide.svelte";

    function create_fragment$3(ctx) {
    	let li;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);
    	let li_levels = [{ class: "splide__slide" }, /*$$props*/ ctx[0]];
    	let li_data = {};

    	for (let i = 0; i < li_levels.length; i += 1) {
    		li_data = assign$1(li_data, li_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			if (default_slot) default_slot.c();
    			set_attributes(li, li_data);
    			add_location(li, file$3, 3, 0, 53);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (default_slot) {
    				default_slot.m(li, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}

    			set_attributes(li, li_data = get_spread_update(li_levels, [{ class: "splide__slide" }, dirty & /*$$props*/ 1 && /*$$props*/ ctx[0]]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SplideSlide', slots, ['default']);

    	$$self.$$set = $$new_props => {
    		$$invalidate(0, $$props = assign$1(assign$1({}, $$props), exclude_internal_props($$new_props)));
    		if ('$$scope' in $$new_props) $$invalidate(1, $$scope = $$new_props.$$scope);
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(0, $$props = assign$1(assign$1({}, $$props), $$new_props));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [$$props, $$scope, slots];
    }

    class SplideSlide extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SplideSlide",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/ScoreEditor.svelte generated by Svelte v3.44.3 */
    const file$2 = "src/components/ScoreEditor.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[6] = list;
    	child_ctx[7] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[9] = list;
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (15:1) {#if players.length != 0}
    function create_if_block$1(ctx) {
    	let splide;
    	let current;

    	splide = new Splide_1({
    			props: {
    				options: {
    					type: "loop",
    					padding: "4rem",
    					gap: "5rem",
    					arrows: true,
    					dragMinThreshold: 25,
    					breakpoints: {
    						768: { padding: "0", gap: "2rem", arrows: false }
    					}
    				},
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(splide.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(splide, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const splide_changes = {};

    			if (dirty & /*$$scope, players*/ 2049) {
    				splide_changes.$$scope = { dirty, ctx };
    			}

    			splide.$set(splide_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(splide.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(splide.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(splide, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(15:1) {#if players.length != 0}",
    		ctx
    	});

    	return block;
    }

    // (39:7) {#each scoreTypes as score}
    function create_each_block_1(ctx) {
    	let label;
    	let t0_value = /*score*/ ctx[8] + "";
    	let t0;
    	let t1;
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[3].call(input, /*score*/ ctx[8], /*each_value*/ ctx[6], /*player_index*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			t0 = text(t0_value);
    			t1 = space();
    			input = element("input");
    			attr_dev(label, "for", "score");
    			add_location(label, file$2, 39, 8, 922);
    			attr_dev(input, "type", "number");
    			add_location(input, file$2, 40, 8, 965);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*player*/ ctx[5].scores[/*score*/ ctx[8]]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*update*/ ctx[1], false, false, false),
    					listen_dev(input, "input", input_input_handler)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*players, scoreTypes*/ 5 && to_number(input.value) !== /*player*/ ctx[5].scores[/*score*/ ctx[8]]) {
    				set_input_value(input, /*player*/ ctx[5].scores[/*score*/ ctx[8]]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(39:7) {#each scoreTypes as score}",
    		ctx
    	});

    	return block;
    }

    // (35:4) <SplideSlide>
    function create_default_slot_1(ctx) {
    	let div;
    	let article;
    	let h3;
    	let t0_value = /*player*/ ctx[5].name + "";
    	let t0;
    	let t1;
    	let t2;
    	let each_value_1 = /*scoreTypes*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			article = element("article");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			add_location(h3, file$2, 37, 7, 856);
    			add_location(article, file$2, 36, 6, 839);
    			attr_dev(div, "class", "container-full");
    			add_location(div, file$2, 35, 5, 804);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, article);
    			append_dev(article, h3);
    			append_dev(h3, t0);
    			append_dev(article, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(article, null);
    			}

    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*players*/ 1 && t0_value !== (t0_value = /*player*/ ctx[5].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*players, scoreTypes, update*/ 7) {
    				each_value_1 = /*scoreTypes*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(article, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(35:4) <SplideSlide>",
    		ctx
    	});

    	return block;
    }

    // (34:3) {#each players as player (player.id)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let splideslide;
    	let current;

    	splideslide = new SplideSlide({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty$1();
    			create_component(splideslide.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(splideslide, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const splideslide_changes = {};

    			if (dirty & /*$$scope, players*/ 2049) {
    				splideslide_changes.$$scope = { dirty, ctx };
    			}

    			splideslide.$set(splideslide_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(splideslide.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(splideslide.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(splideslide, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(34:3) {#each players as player (player.id)}",
    		ctx
    	});

    	return block;
    }

    // (16:2) <Splide    options={{     type: "loop",     padding: "4rem",     gap: "5rem",     arrows: true,      dragMinThreshold: 25,      breakpoints: {      768: {       padding: "0",       gap: "2rem",       arrows: false,      },     },    }}   >
    function create_default_slot(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*players*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*player*/ ctx[5].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty$1();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*scoreTypes, players, update*/ 7) {
    				each_value = /*players*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(16:2) <Splide    options={{     type: \\\"loop\\\",     padding: \\\"4rem\\\",     gap: \\\"5rem\\\",     arrows: true,      dragMinThreshold: 25,      breakpoints: {      768: {       padding: \\\"0\\\",       gap: \\\"2rem\\\",       arrows: false,      },     },    }}   >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current;
    	let if_block = /*players*/ ctx[0].length != 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			add_location(div, file$2, 13, 0, 465);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*players*/ ctx[0].length != 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*players*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ScoreEditor', slots, []);
    	let { players } = $$props;
    	const dispatch = createEventDispatcher();

    	function update() {
    		dispatch("updateplayers", { players });
    	}

    	const scoreTypes = [
    		"Wonders",
    		"Coins",
    		"Military conflicts",
    		"Blue cards",
    		"Yellow cards",
    		"Green cards",
    		"Violet cards"
    	];

    	const writable_props = ['players'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ScoreEditor> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler(score, each_value, player_index) {
    		each_value[player_index].scores[score] = to_number(this.value);
    		$$invalidate(0, players);
    		$$invalidate(2, scoreTypes);
    	}

    	$$self.$$set = $$props => {
    		if ('players' in $$props) $$invalidate(0, players = $$props.players);
    	};

    	$$self.$capture_state = () => ({
    		Splide: Splide_1,
    		SplideSlide,
    		createEventDispatcher,
    		players,
    		dispatch,
    		update,
    		scoreTypes
    	});

    	$$self.$inject_state = $$props => {
    		if ('players' in $$props) $$invalidate(0, players = $$props.players);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [players, update, scoreTypes, input_input_handler];
    }

    class ScoreEditor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { players: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ScoreEditor",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*players*/ ctx[0] === undefined && !('players' in props)) {
    			console.warn("<ScoreEditor> was created without expected prop 'players'");
    		}
    	}

    	get players() {
    		throw new Error("<ScoreEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set players(value) {
    		throw new Error("<ScoreEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/PlayerManager.svelte generated by Svelte v3.44.3 */

    const { Map: Map_1 } = globals;
    const file$1 = "src/components/PlayerManager.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (20:0) {#if players.length != 0}
    function create_if_block(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map_1();
    	let each_value = /*players*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*player*/ ctx[5].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "grid");
    			add_location(div, file$1, 20, 0, 479);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*players*/ 1) {
    				each_value = /*players*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(20:0) {#if players.length != 0}",
    		ctx
    	});

    	return block;
    }

    // (22:1) {#each players as player (player.id)}
    function create_each_block(key_1, ctx) {
    	let div;
    	let p;
    	let t0_value = /*player*/ ctx[5].name + "";
    	let t0;
    	let t1;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			add_location(p, file$1, 23, 2, 561);
    			attr_dev(div, "class", "player");
    			add_location(div, file$1, 22, 1, 538);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(div, t1);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*players*/ 1 && t0_value !== (t0_value = /*player*/ ctx[5].name + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(22:1) {#each players as player (player.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let h3;
    	let t1;
    	let t2;
    	let input;
    	let input_placeholder_value;
    	let t3;
    	let div;
    	let button0;
    	let t5;
    	let button1;
    	let mounted;
    	let dispose;
    	let if_block = /*players*/ ctx[0].length != 0 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Players";
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			input = element("input");
    			t3 = space();
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Add";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Remove";
    			add_location(h3, file$1, 17, 0, 435);
    			attr_dev(input, "placeholder", input_placeholder_value = `Player ${/*players*/ ctx[0].length + 1}`);
    			attr_dev(input, "type", "text");
    			add_location(input, file$1, 45, 0, 922);
    			add_location(button0, file$1, 47, 1, 1032);
    			attr_dev(button1, "class", "secondary");
    			add_location(button1, file$1, 48, 1, 1075);
    			attr_dev(div, "class", "grid");
    			add_location(div, file$1, 46, 0, 1012);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*textInput*/ ctx[1]);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t5);
    			append_dev(div, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(button0, "click", /*addPlayer*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*removePlayer*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*players*/ ctx[0].length != 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(t2.parentNode, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*players*/ 1 && input_placeholder_value !== (input_placeholder_value = `Player ${/*players*/ ctx[0].length + 1}`)) {
    				attr_dev(input, "placeholder", input_placeholder_value);
    			}

    			if (dirty & /*textInput*/ 2 && input.value !== /*textInput*/ ctx[1]) {
    				set_input_value(input, /*textInput*/ ctx[1]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PlayerManager', slots, []);
    	let { players } = $$props;
    	var textInput;

    	function removePlayer() {
    		$$invalidate(0, players = players.slice(0, -1));
    	}

    	function addPlayer(event) {
    		let name = event.detail.text == undefined
    		? `Player ${players.length + 1}`
    		: event.detail.text;

    		let newplayer = {
    			id: players.length + 1,
    			name,
    			scores: new Map([])
    		};

    		$$invalidate(0, players = [...players, newplayer]);
    	}

    	const writable_props = ['players'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PlayerManager> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		textInput = this.value;
    		$$invalidate(1, textInput);
    	}

    	$$self.$$set = $$props => {
    		if ('players' in $$props) $$invalidate(0, players = $$props.players);
    	};

    	$$self.$capture_state = () => ({
    		players,
    		textInput,
    		removePlayer,
    		addPlayer
    	});

    	$$self.$inject_state = $$props => {
    		if ('players' in $$props) $$invalidate(0, players = $$props.players);
    		if ('textInput' in $$props) $$invalidate(1, textInput = $$props.textInput);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [players, textInput, removePlayer, addPlayer, input_input_handler];
    }

    class PlayerManager extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { players: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlayerManager",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*players*/ ctx[0] === undefined && !('players' in props)) {
    			console.warn("<PlayerManager> was created without expected prop 'players'");
    		}
    	}

    	get players() {
    		throw new Error("<PlayerManager>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set players(value) {
    		throw new Error("<PlayerManager>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.3 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let main0;
    	let playermanager;
    	let updating_players;
    	let t1;
    	let hr;
    	let t2;
    	let scoreeditor;
    	let updating_players_1;
    	let t3;
    	let main1;
    	let current;

    	function playermanager_players_binding(value) {
    		/*playermanager_players_binding*/ ctx[1](value);
    	}

    	let playermanager_props = {};

    	if (/*players*/ ctx[0] !== void 0) {
    		playermanager_props.players = /*players*/ ctx[0];
    	}

    	playermanager = new PlayerManager({
    			props: playermanager_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind$1(playermanager, 'players', playermanager_players_binding));

    	function scoreeditor_players_binding(value) {
    		/*scoreeditor_players_binding*/ ctx[2](value);
    	}

    	let scoreeditor_props = {};

    	if (/*players*/ ctx[0] !== void 0) {
    		scoreeditor_props.players = /*players*/ ctx[0];
    	}

    	scoreeditor = new ScoreEditor({ props: scoreeditor_props, $$inline: true });
    	binding_callbacks.push(() => bind$1(scoreeditor, 'players', scoreeditor_players_binding));

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			main0 = element("main");
    			create_component(playermanager.$$.fragment);
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			create_component(scoreeditor.$$.fragment);
    			t3 = space();
    			main1 = element("main");
    			add_location(div0, file, 6, 1, 176);
    			add_location(div1, file, 5, 0, 169);
    			add_location(hr, file, 14, 1, 275);
    			attr_dev(main0, "class", "container-fluid");
    			add_location(main0, file, 11, 0, 201);
    			attr_dev(main1, "class", "container");
    			add_location(main1, file, 19, 0, 331);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main0, anchor);
    			mount_component(playermanager, main0, null);
    			append_dev(main0, t1);
    			append_dev(main0, hr);
    			append_dev(main0, t2);
    			mount_component(scoreeditor, main0, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, main1, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const playermanager_changes = {};

    			if (!updating_players && dirty & /*players*/ 1) {
    				updating_players = true;
    				playermanager_changes.players = /*players*/ ctx[0];
    				add_flush_callback(() => updating_players = false);
    			}

    			playermanager.$set(playermanager_changes);
    			const scoreeditor_changes = {};

    			if (!updating_players_1 && dirty & /*players*/ 1) {
    				updating_players_1 = true;
    				scoreeditor_changes.players = /*players*/ ctx[0];
    				add_flush_callback(() => updating_players_1 = false);
    			}

    			scoreeditor.$set(scoreeditor_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(playermanager.$$.fragment, local);
    			transition_in(scoreeditor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(playermanager.$$.fragment, local);
    			transition_out(scoreeditor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main0);
    			destroy_component(playermanager);
    			destroy_component(scoreeditor);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(main1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let players = [];
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function playermanager_players_binding(value) {
    		players = value;
    		$$invalidate(0, players);
    	}

    	function scoreeditor_players_binding(value) {
    		players = value;
    		$$invalidate(0, players);
    	}

    	$$self.$capture_state = () => ({ ScoreEditor, PlayerManager, players });

    	$$self.$inject_state = $$props => {
    		if ('players' in $$props) $$invalidate(0, players = $$props.players);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [players, playermanager_players_binding, scoreeditor_players_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /// <reference types="svelte" />

    const app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
