var finesse = finesse || {};
finesse.gadget = finesse.gadget || {};
finesse.container = finesse.container || {};
_clientLogger = finesse.cslogger.ClientLogger || {};  // for logging

/** @namespace */
finesse.modules = finesse.modules || {};
finesse.modules.OpenCXGadget = (function ($) {
    var _user, _dialogs, _dialog;
    var NO_MSG_HEIGHT = 30;
    var _uiOpenButton = "#uiOpenButton";
    /**
     * Populates the fields in the gadget with data
     */
    _updateUI = function () {

        _clientLogger.log("_updateUI() - _dialog: " + ((_dialog === null) ? "none" : _dialog.getId()));
        console.log("_updateUI() - _dialog: " + ((_dialog === null) ? "none" : _dialog.getId()));
        if (_dialog) {
            var dialogId = _dialog.getId() || "";
            var callVars = _dialog.getMediaProperties() || "";
            var callerID = _dialog.getFromAddress() || "";
            $('#uiCallerID').text("Caller ID:" + callerID);
            $('#uiEntered').text("Number entered by Donor:" + callVars["callVariable6"]);
        }
        else {
            $('#uiCallerID').text("");
            $('#uiEntered').text("");
            $(_uiOpenButton).hide();
        }

        var state = _user.getState() || "";
        $('#uiState').text("User state:" + state);

        gadgets.window.adjustHeight();
    },

        _openCX = function () {
            console.log("_openCX function executing");
            debugger;
            if (_dialog === null) {

                return;
            }
            var dialogId = _dialog.getId() || "";
            var state = _dialog.getState() || "";
            var callVars = _dialog.getMediaProperties() || "";
            var callerID = _dialog.getFromAddress() || "";
            var callV = callVars["callVariable6"] || "";
            // $('#uiState').text("open state:" + state);
            // $('#uiCallerID').text("Caller ID:" + callerID);
            // $('#uiEntered').text("Number entered by Donor:" + callVars["callVariable6"]);
            // console.log(callVars["callVariable6"]);
            // Trigger ONLY when call is answered
            //if (state === "TALKING" && !launchedCalls[dialogId]) {
            if (_user.getState() === 'TALKING') {
                // Show the make call button when the call is ended
                $(_uiOpenButton).show();
                console.log('Agent is currently talking');
                //launchedCalls[dialogId] = true;

                //var ani = _dialog.getFromAddress() || "";
                //var dnis = _dialog.getToAddress() || "";
                //var callId = dialog.getMediaProperties().callid || "";

                var url =
                    "https://my1002373.us1.test.crm.cloud.sap/auth/login?" +
                    "&phone=" + encodeURIComponent(callerID);

                console.log("open cx url" + url);
                window.open(url, "_blank");

            }
        },

        /**
         * Returns the count of Dialogs from the Dialogs Collection
         */
        _getDialogCount = function () {
            var count = 0;
            var dialogCollection, dialogId;

            dialogCollection = _dialogs.getCollection();
            for (var dialogId in dialogCollection) {
                if (dialogCollection.hasOwnProperty(dialogId))
                    ++count;
            }

            return count;
        },

        /**
         * Handler for makeCall when successful.
         */
        _startRecordingSuccess = function (rsp) {
            _clientLogger.log("_startRecordingSuccess(): in method");

            $('#successMsg').fadeIn("slow");

            gadgets.window.adjustHeight();

            window.setTimeout(function () {
                $('#successMsg').fadeOut("slow", 0, function () { gadgets.window.adjustHeight(NO_MSG_HEIGHT); });
            }, 4000);

        },

        /**
         * Handler for makeCall when error occurs.
         */
        _startRecordingError = function (rsp) {
            _clientLogger.log("_startRecordingError(): in method");

            errorType = rsp.object.ApiErrors.ApiError.ErrorType;
            errorMessage = rsp.object.ApiErrors.ApiError.ErrorMessage;

            _clientLogger.log("_startRecordingError() - errorType: " + errorType);
            _clientLogger.log("_startRecordingError() - errorMessage: " + errorMessage);

            $('#errorMsgType').text(errorType);
            $('#errorMsgMessage').text(errorMessage);
            $('#errorMsg').fadeIn("slow");

            gadgets.window.adjustHeight();

            window.setTimeout(function () {
                $('#errorMsg').fadeOut("slow", 0, function () { gadgets.window.adjustHeight(NO_MSG_HEIGHT); });
            }, 4000);
        },

        // Handler to handle changes in a dialog
        _handleDialogChange = function (dialog) {
            _clientLogger.log("_handleDialogChange() - dialog.getId(): " + dialog.getId());

            _updateUI();
        },

        /**
         *  Handler for additions to the Dialogs collection object.  This will occur when a new
         *  Dialog is created on the Finesse server for this user.
         */
        _handleDialogAdd = function (dialog) {
            console.log("------- _handleDialogAdd () -------" + dialog.getId());
            _clientLogger.log("_handleDialogAdd() - dialog.getId(): " + dialog.getId());

            // Really need to handle this a little better...but this is just a sample.  This doesn't handle multiple calls properly.        
            _dialog = dialog;

            _updateUI();



            // add a change handler to the dialog
            dialog.addHandler('change', _handleDialogChange);
        },

        /**
         *  Handler for deletions from the Dialogs collection object for this user.  This will occur
         *  when a Dialog is removed from this user's collection (example, end call)
         */
        _handleDialogDelete = function (dialog) {
            console.log("------- _handleDialogDelete () -------");
            _clientLogger.log("_handleDialogDelete() - dialog.getId(): " + dialog.getId());

            if (dialog.getId() === _dialog.getId()) {
                _dialog = null;
            } else {
                _clientLogger.log("_handleDialogDelete() - Last Dialog added had Id of: " + _dialog.getId() + ", so not clearing Dialog reference for: " + dialog.getId());
            }

            _updateUI();
        },

        /**
         * Handler for when GET Dialogs has loaded
         *
         */
        _handleDialogsLoaded = function () {
            console.log("------- _handleDialogsLoaded() -------");
            var dialogCollection, dialogId;
            //Render any existing dialogs
            dialogCollection = _dialogs.getCollection();
            for (dialogId in dialogCollection) {
                if (dialogCollection.hasOwnProperty(dialogId)) {
                    _handleDialogAdd(dialogCollection[dialogId]);
                }
            }
        },

        /**
         * Handler for the onLoad of a User object.  This occurs when the User object is initially read
         * from the Finesse server.  Any once only initialization should be done within this function.
         */
        _handleUserLoad = function (userevent) {
            console.log("------- _handleUserLoad() -------");
            _clientLogger.log("_handleUserLoad(): in method");

            // Get an instance of the dialogs collection and register handlers for dialog additions and
            // removals
            _dialogs = _user.getDialogs({
                onCollectionAdd: _handleDialogAdd,
                onCollectionDelete: _handleDialogDelete,
                onLoad: _handleDialogsLoaded
            });

            _updateUI();
        },

        /**
         *  Handler for all User updates
         */
        _handleUserChange = function (userevent) {
            _clientLogger.log("_handleUserChange()");
            console.log(userevent);
            _updateUI();
            _openCX();
        };

    /** @scope finesse.modules.OpenCXGadget */
    return {
        /**
         * Try to initiate the recording
         */
        openBtnPressed: function () {
            console.log("openBtnPressed(): in method");
            _openCX();
        },

        startRecording: function () {
            _clientLogger.log("startRecording(): in method");

            if (_dialog === null) {
                _clientLogger.log("startRecording(): No Dialog to start recording on.");
                return;
            }

            _clientLogger.log("startRecording(): Starting Recording on Dialog: " + _dialog.getId());

            _dialog.requestAction(_user.getExtension(),
                finesse.restservices.Dialog.Actions.START_RECORDING,
                {
                    success: _startRecordingSuccess,
                    error: _startRecordingError
                });
        },

        /**
         * Performs all initialization for this gadget
         */
        init: function () {
            var _clientLogger = finesse.cslogger.ClientLogger;   // declare _clientLogger

            // Initiate the ClientLogs. The gadget id will be logged as a part of the message
            _clientLogger.init(gadgets.Hub, "OpenCXGadget", finesse.gadget.Config);
            _clientLogger.log("init(): Initializing...");

            // Initiate the ClientServices and load the user object.  ClientServices are
            // initialized with a reference to the current configuration.
            finesse.clientservices.ClientServices.init(finesse.gadget.Config);

            gadgets.window.adjustHeight(NO_MSG_HEIGHT);

            _dialogs = [];
            _dialog = null;

            _user = new finesse.restservices.User({
                id: finesse.gadget.Config.id,
                onLoad: _handleUserLoad,
                onChange: _handleUserChange
            });

            _clientLogger.log("init(): Initialization finished.");
        }
    };
}(jQuery));