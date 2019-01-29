/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals document, Event */

import BalloonEditorUI from '../src/ballooneditorui';
import EditorUI from '@ckeditor/ckeditor5-core/src/editor/editorui';
import BalloonEditorUIView from '../src/ballooneditoruiview';
import VirtualTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/virtualtesteditor';
import BalloonToolbar from '@ckeditor/ckeditor5-ui/src/toolbar/balloon/balloontoolbar';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';
import { isElement } from 'lodash-es';

import utils from '@ckeditor/ckeditor5-utils/tests/_utils/utils';
import testUtils from '@ckeditor/ckeditor5-core/tests/_utils/utils';

describe( 'BalloonEditorUI', () => {
	let editor, view, ui, viewElement;

	testUtils.createSinonSandbox();

	beforeEach( () => {
		return VirtualBalloonTestEditor
			.create( 'foo', {
				plugins: [ BalloonToolbar ]
			} )
			.then( newEditor => {
				editor = newEditor;
				ui = editor.ui;
				view = ui.view;
				viewElement = view.editable.element;
			} );
	} );

	afterEach( () => {
		editor.destroy();
	} );

	describe( 'constructor()', () => {
		it( 'extends EditorUI', () => {
			expect( ui ).to.instanceof( EditorUI );
		} );
	} );

	describe( 'init()', () => {
		it( 'initializes the #view', () => {
			expect( view.isRendered ).to.be.true;
		} );

		it( 'initializes keyboard navigation between view#toolbar and view#editable', () => {
			const toolbar = editor.plugins.get( 'BalloonToolbar' );
			const toolbarFocusSpy = testUtils.sinon.stub( toolbar.toolbarView, 'focus' ).returns( {} );
			const toolbarShowSpy = testUtils.sinon.stub( toolbar, 'show' ).returns( {} );
			const toolbarHideSpy = testUtils.sinon.stub( toolbar, 'hide' ).returns( {} );
			const editingFocusSpy = testUtils.sinon.stub( editor.editing.view, 'focus' ).returns( {} );

			ui.focusTracker.isFocused = true;

			// #show and #hide are mocked so mocking the focus as well.
			toolbar.toolbarView.focusTracker.isFocused = false;

			editor.keystrokes.press( {
				keyCode: keyCodes.f10,
				altKey: true,
				preventDefault: sinon.spy(),
				stopPropagation: sinon.spy()
			} );

			sinon.assert.callOrder( toolbarShowSpy, toolbarFocusSpy );
			sinon.assert.notCalled( toolbarHideSpy );
			sinon.assert.notCalled( editingFocusSpy );

			// #show and #hide are mocked so mocking the focus as well.
			toolbar.toolbarView.focusTracker.isFocused = true;

			toolbar.toolbarView.keystrokes.press( {
				keyCode: keyCodes.esc,
				preventDefault: sinon.spy(),
				stopPropagation: sinon.spy()
			} );

			sinon.assert.callOrder( editingFocusSpy, toolbarHideSpy );
		} );

		describe( 'editable', () => {
			let editable;

			beforeEach( () => {
				editable = editor.editing.view.document.getRoot();
			} );

			it( 'registers view.editable#element in editor focus tracker', () => {
				ui.focusTracker.isFocused = false;

				view.editable.element.dispatchEvent( new Event( 'focus' ) );
				expect( ui.focusTracker.isFocused ).to.true;
			} );

			it( 'sets view.editable#name', () => {
				expect( view.editable.name ).to.equal( editable.rootName );
			} );

			it( 'binds view.editable#isFocused', () => {
				utils.assertBinding(
					view.editable,
					{ isFocused: false },
					[
						[ ui.focusTracker, { isFocused: true } ]
					],
					{ isFocused: true }
				);
			} );
		} );

		describe( 'placeholder', () => {
			it( 'sets placeholder from editor.config.placeholder', () => {
				return VirtualBalloonTestEditor
					.create( 'foo', {
						extraPlugins: [ BalloonToolbar, Paragraph ],
						placeholder: 'placeholder-text',
					} )
					.then( newEditor => {
						editor = newEditor;

						const firstChild = editor.editing.view.document.getRoot().getChild( 0 );

						expect( firstChild.getAttribute( 'data-placeholder' ) ).to.equal( 'placeholder-text' );

						return editor.destroy();
					} );
			} );

			it( 'sets placeholder from "placeholder" attribute of a passed element', () => {
				const element = document.createElement( 'div' );

				element.setAttribute( 'placeholder', 'placeholder-text' );

				return VirtualBalloonTestEditor
					.create( element, {
						extraPlugins: [ BalloonToolbar, Paragraph ]
					} )
					.then( newEditor => {
						editor = newEditor;

						const firstChild = editor.editing.view.document.getRoot().getChild( 0 );

						expect( firstChild.getAttribute( 'data-placeholder' ) ).to.equal( 'placeholder-text' );

						return editor.destroy();
					} );
			} );

			it( 'uses editor.config.placeholder rather than "placeholder" attribute of a passed element', () => {
				const element = document.createElement( 'div' );

				element.setAttribute( 'placeholder', 'placeholder-text' );

				return VirtualBalloonTestEditor
					.create( element, {
						placeholder: 'config takes precedence',
						extraPlugins: [ BalloonToolbar, Paragraph ]
					} )
					.then( newEditor => {
						editor = newEditor;

						const firstChild = editor.editing.view.document.getRoot().getChild( 0 );

						expect( firstChild.getAttribute( 'data-placeholder' ) ).to.equal( 'config takes precedence' );

						return editor.destroy();
					} );
			} );
		} );
	} );

	describe( 'element()', () => {
		it( 'returns correct element instance', () => {
			expect( ui.element ).to.equal( viewElement );
		} );
	} );

	describe( 'getEditableElement()', () => {
		it( 'returns editable element (default)', () => {
			expect( ui.getEditableElement() ).to.equal( view.editable.element );
		} );

		it( 'returns editable element (root name passed)', () => {
			expect( ui.getEditableElement( 'main' ) ).to.equal( view.editable.element );
		} );

		it( 'returns undefined if editable with the given name is absent', () => {
			expect( ui.getEditableElement( 'absent' ) ).to.be.undefined;
		} );
	} );
} );

class VirtualBalloonTestEditor extends VirtualTestEditor {
	constructor( sourceElementOrData, config ) {
		super( config );

		if ( isElement( sourceElementOrData ) ) {
			this.sourceElement = sourceElementOrData;
		}

		const view = new BalloonEditorUIView( this.locale, this.editing.view );
		this.ui = new BalloonEditorUI( this, view );
	}

	destroy() {
		this.ui.destroy();

		return super.destroy();
	}

	static create( sourceElementOrData, config ) {
		return new Promise( resolve => {
			const editor = new this( sourceElementOrData, config );

			resolve(
				editor.initPlugins()
					.then( () => {
						editor.ui.init();

						const initialData = isElement( sourceElementOrData ) ?
							sourceElementOrData.innerHTML :
							sourceElementOrData;

						editor.data.init( initialData );
						editor.fire( 'ready' );
					} )
					.then( () => editor )
			);
		} );
	}
}
