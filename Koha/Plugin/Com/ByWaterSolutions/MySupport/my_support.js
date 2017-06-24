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
                    "username":    $(".loggedinusername").html(), 
                    "url":         document.URL,
                };

                support_submit( payload, "get_initial_data", show_startpage );
                console.log( 'get_initiali_data payload: ' );
                console.log( payload );
            });


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

function show_startpage ( data ) {
    console.log("inside show_startpage.");
    $('#startpage').show();
    $('#my_support_name').val(data.support_data.username);
    $('#my_support_email').val(data.support_data.user.email);
    $('#category').html(data.category);
    $('#page').html(data.page);
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
    payload = data;
    console.log( 'show_startpage() payload: ' );
    console.log( payload );
}

function process_startpage() {

    var category = $("#support_category").val();

    if (typeof borrowernumber != 'undefined') {
        borrower = borrowernumber;
    } else {
        console.log("borrowernumber is undefined")
        borrower = '';
    }

    payload.support_data.user.email    = $("#my_support_email").val();
    payload.support_data.user.username = $("#my_support_name").val();
    payload.support_data.category = category;
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
    console.log( data );
    $('#circulation').show();
    $('#circ_borrower').val(data.support_data.circulation.borrower.cardnumber);

    console.log( 'show_circulation() payload: ' );
    payload = data;
    console.log( payload );
}

function process_circulation() {

    payload.cardnumber = $("circ_borrower").val();
    payload.item_barcode = $("circ_barcode").val();
    payload.circ_description = $("circ_description").val();

    support_submit( payload, "passthrough", show_basic_info );
}

function process_basic_info() {
    payload.browser_cache_cleared = $("browser_cache").val();
    payload.expected_results = $("expected").val();
    payload.actual_results = $("actual").val();
    payload.Errormessage = $("Errormessage").val();

    support_submit( payload, "passthrough", show_basic_info_when );
}

function show_basic_info ( data ) {
    $('#basic_info').show();
    console.log( 'show_basic_info() data.success : ' + data.success );
    payload = data;
}

function process_basic_info_when() {
    payload.issue_frequency = $("how_often").val();
    payload.issue_when = $("when").val();

    support_submit( payload, "passthrough", show_basic_info_changes );
}

function show_basic_info_when() {
    $('#basic_info_when').show();
}

function process_basic_info_changes() {
    payload.recent_changes = $("recent_changes").val();
    payload.recent_change_description = $("recent_change_description").val();
    payload.other_recent_changes = $("other_recent_changes").val();
    support_submit( payload, "passthrough", show_basic_info_finish );
}

function show_basic_info_changes() {
    $('#basic_info_changes').show();
}

function process_basic_info_finish() {
    payload.steps_to_re_create = $("#steps_to_re_create").val();
    payload.tried_other_browser = $("#tried_other_browser").val();
    payload.email_subject = $("#email_subject").val();
    payload.html = $('html')[0].outerHTML;

    support_submit( payload, "process_support_request", support_data_submitted );
};

function show_basic_info_finish() {
    $('#basic_info_finish').show();
}

