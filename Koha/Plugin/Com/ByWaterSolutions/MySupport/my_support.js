var payload;

console.log("Koha/Plugin/Com/ByWaterSolutions/MySupport/my_support.js got here 1");
function support_submit( userdata, sub, callback ) {
    $('.support').hide();

    var data = {};
    data.userdata = JSON.stringify(userdata)
    data.class = "Koha::Plugin::Com::ByWaterSolutions::MySupport";
    data.method = "tool";
    data.sub = sub;
    console.log( "Support submit: ");
    console.log( data );

    $.ajax({ 
        type: "POST",
        url: "/cgi-bin/koha/plugins/run.pl",
        data: data,
        success: callback,
        dataType: "json",
    });

}

console.log("Koha/Plugin/Com/ByWaterSolutions/MySupport/my_support.js got here 2");
function category_dispatch( key ) {
    var submittable = {
        'Circulation' : {
            'sub' : 'circulation',
            'callback' : show_circulation
        }
    }
    if( key in submittable ) {
        return submittable[key];
    } else {
        return { 'sub' : 'passthrough', 'callback' : show_basic_info  };
    }
}

console.log("Koha/Plugin/Com/ByWaterSolutions/MySupport/my_support.js got here 3");
$.getScript('/plugin/Koha/Plugin/Com/ByWaterSolutions/MySupport/pageslide/jquery.pageslide.min.js', function() {
    $.get("/plugin/Koha/Plugin/Com/ByWaterSolutions/MySupport/pageslide/jquery.pageslide.css", function(css){
        $("<style></style>").appendTo("head").html(css);
        $.get("/plugin/Koha/Plugin/Com/ByWaterSolutions/MySupport/my_support.html", function(html){
            $('body').append(html);

console.log("Koha/Plugin/Com/ByWaterSolutions/MySupport/my_support.js got here 4");
            // Get User and document URL.
            $('#my_support_link').click( function() {
                $.pageslide({ href: '#modal', direction: "left", modal: true });
                $('#my_support_link').hide();

                payload = {
                    "username":     $(".loggedinusername").html(), 
                    "url":          document.URL,
                    "support_data_array" : [],
                    "support_data": {} 
                };

                payload.support_data_array.push( { "url" : document.URL } );
                payload.support_data_array.push( { "branchname" : $("#logged-in-branch-name").html()  } );
                payload.support_data_array.push( { "branchcode" : $("#logged-in-branch-code").html()  } );
                payload.support_data.url = document.URL;

                support_submit( payload, "get_initial_data", show_startpage );
                console.log( 'get_initiali_data payload: ' );
                console.log( payload );
            });

            /**** BASIC ONLY WORK-FLOW ****/
            $('#basic_only_support_startpage_submit').click( process_basic_only_startpage );
            $('#basic_only_request_submit').click( process_basic_only_request );
            $('#basic_only_summary_submit').click( process_basic_only_summary );
            /**** END BASIC ONLY WORK-FLOW ****/
            // Get Support Categories
            $('#my_support_startpage_submit').click( process_startpage );

            // Process Support Categories
            $('#circ_submit').click( process_circulation );
            
            // End Support Category Processing

            // Get basic information
            $('#my_support_basic_info_submit').click( process_basic_info );

            $('#my_support_basic_info_when_submit').click( process_basic_info_when );

            $('#my_support_basic_info_changes_submit').click( process_basic_info_changes );

            $('#my_support_submit_email').click( process_basic_info_finish )

            $('#my_support_cancel').click( function() {
                $.pageslide.close();
                $('#my_support_link').show();
            });
        });
    });
});

function show_startpage ( data ) {
    console.log("inside show_startpage.");
    if( data.basic_only == 0) {
        $('#startpage').show();
        $('#my_support_name').val(data.support_data.user.userid);
        $('#my_support_email').val(data.support_data.user.email);
        $('#category').html(data.category);
        $('#support_category').append(
            '<option value="' 
            + data.category_data.selected_category + '">' 
            + data.category_data.selected_category + '</option>'
        );
        for( i=0; i<data.category_data.category_list.length; ++i ) {
            $('#support_category').append(
                '<option value="' + data.category_data.category_list[i] + '">' 
                + data.category_data.category_list[i] + '</option>'
            );
        }
    } else {
        $('#basic_only_startpage').show();
        $('#basic_only_support_name').val(data.support_data.user.userid);
        $('#basic_only_support_email').val(data.support_data.user.email);
    }
    $('#page').html(data.page);
    payload = data;
    console.log( 'show_startpage() payload: ' );
    console.log( payload );
}

/* basic_only work flow */
function process_basic_only_startpage() {

    if (typeof borrowernumber != 'undefined') {
        borrower = borrowernumber;
    } else {
        console.log("borrowernumber is undefined")
        borrower = '';
    }

    payload.support_data.user.email  = $("#basic_only_support_email").val();
    payload.support_data.user.userid = $("#basic_only_support_name").val();
    payload.support_data.user.phone  = $("#basic_only_support_phone").val();
    payload.support_data_array.push( { "user" : payload.support_data.user } );
    payload.borrower = borrower;

    console.log( payload );
    support_submit( payload, "passthrough", show_basic_only_request );

}

function show_basic_only_request( data ) {
    $('#basic_only_request').show();

    payload = data;
}

function process_basic_only_request() {

    payload.support_data_array.push( { "request" : $("#basic_only_request_text").val() } );

    console.log( payload );
    support_submit( payload, "passthrough", show_basic_only_summary );
}

function show_basic_only_summary( data ) {
    $('#basic_only_summary').show();

    payload = data;
}

function process_basic_only_summary() {

    if( $("#basic_only_request_text").val() === "no" ) {
        $.pageslide.close();
        $('#my_support_link').show();
    } else {
        console.log( payload );

        payload.email_subject = "Support request from " + payload.support_data.user.userid;
        payload.html = $('html')[0].outerHTML;

        support_submit( payload, "process_support_request", support_data_submitted );
    }
}
/* end of basic_only work flow */


function process_startpage() {

    var category = $("#support_category").val();

    if (typeof borrowernumber != 'undefined') {
        borrower = borrowernumber;
    } else {
        console.log("borrowernumber is undefined")
        borrower = '';
    }

    payload.support_data.user.email  = $("#my_support_email").val();
    payload.support_data.user.userid = $("#my_support_name").val();
    payload.support_data.category = category;
    payload.support_data_array.push( { "category" : category } );
    payload.support_data_array.push( { "user" : payload.support_data.user } );
    payload.category = category;
    payload.borrower = borrower;

    console.log("Support catgory: " , category );

    var dispatch = category_dispatch( category );
    console.log( "Dispatch sub: ", dispatch.sub, " callback: ", dispatch.callback );
    console.log( 'process_startpage() payload: ' );
    console.log( payload );
    support_submit( payload, dispatch.sub, dispatch.callback );

}

function show_circulation ( data ) {
    $('#circulation').show();
    $('#circ_borrower').val(data.support_data.circulation.borrower.cardnumber);

    payload = data;
}

function process_circulation() {
    console.log( "in process_circulation" );

    var circulation = [];
    circulation.push( { "cardnumber" : $("#circ_borrower").val() } );
    circulation.push( { "item_barcode" : $("#circ_barcode").val() } );
    circulation.push( { "circ_description" : $("#circ_description").val() } );

    payload.cardnumber = $("#circ_borrower").val();
    payload.support_data.circulation = circulation;
    payload.support_data_array.push( { "circulation": circulation } );

    support_submit( payload, "passthrough", show_basic_info );
}

function show_basic_info ( data ) {
    $('#basic_info').show();
    console.log( 'show_basic_info() data.success : ' + data.success );
    payload = data;
}

function process_basic_info() {
    console.log( "in process_basic_info" );
    var basic = [];
    basic.push( { "browser_cache_cleared": $("#browser_cache").val() } );
    basic.push( { "expected_results": $("#expected").val() } );
    basic.push( { "actual_results": $("#actual").val() } );
    basic.push( { "error_message": $("#Errormessage").val() } );

    payload.support_data.basic = basic;
    payload.support_data_array.push( { "basic" : basic } );

    support_submit( payload, "passthrough", show_basic_info_when );
}

function show_basic_info_when( data ) {
    $('#basic_info_when').show();
    payload = data;
}

function process_basic_info_when() {
    console.log( "in process_basic_info_when" );
    var when = {};
    when.issue_frequency = $("#how_often").val();
    when.issue_when = $("#when").val();

    payload.support_data.when = when;
    payload.support_data_array.push( {"when" : when } );
    support_submit( payload, "passthrough", show_basic_info_changes );
}

function show_basic_info_changes( data ) {
    $('#basic_info_changes').show();
    payload = data;
}

function process_basic_info_changes() {
    console.log( "in process_basic_info_changes" );

    var changes = [];
    payload.support_data.changes = {};
    changes.push( { "recent_changes" : $("#recent_changes").val() } );
    changes.push( { "recent_change_description" : $("#recent_change_description").val() } );
    changes.push( { "other_recent_changes" : $("#other_recent_changes").val() } );

    payload.support_data.changes = changes;
    payload.support_data_array.push( { "changes" : changes } );
    support_submit( payload, "passthrough", show_basic_info_finish );
}

function show_basic_info_finish( data ) {
    $('#basic_info_finish').show();
    payload = data;
}

function process_basic_info_finish() {
    console.log( "in process_basic_info_finish" );
    payload.support_data.steps_to_re_create = $("#steps_to_re_create").val();
    payload.support_data.tried_other_browser = $("#tried_other_browser").val();
    payload.support_data_array.push( { "steps_to_re_create" : $("#steps_to_re_create").val() } );
    payload.support_data_array.push( { "tried_other_browser" : $("#tried_other_browser").val() } );
    payload.email_subject = $("#email_subject").val();
    payload.html = $('html')[0].outerHTML;

    support_submit( payload, "process_support_request", support_data_submitted );
};

function support_data_submitted( data ) {
    if ( data.success ) {
        // Can we get the support email?
        // it would be nice to say
        // "Support request submitted to ..."
        alert("Support request submitted to " + data.mailto + "!");
    } else if ( data.error ) {
        alert("ERROR: " + data.error );
    }
    $.pageslide.close();
    $('#my_support_link').show();
}

