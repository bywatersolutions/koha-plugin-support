var payload;

function support_submit( data, sub, callback ) {
    $('.support').hide();

    data['class'] = "Koha::Plugin::Com::ByWaterSolutions::MySupport";
    data.method = "tool";
    data.sub = sub;
    console.log( data );

    $.ajax({ 
        type: "POST",
        url: "/cgi-bin/koha/plugins/run.pl",
        data: data,
        success: callback,
        dataType: "json",
    });

}

$.getScript('/plugin/Koha/Plugin/Com/ByWaterSolutions/MySupport/pageslide/jquery.pageslide.min.js', function() {
    $.get("/plugin/Koha/Plugin/Com/ByWaterSolutions/MySupport/pageslide/jquery.pageslide.css", function(css){
        $("<style></style>").appendTo("head").html(css);
        $.get("/plugin/Koha/Plugin/Com/ByWaterSolutions/MySupport/my_support.html", function(html){
            $('body').append(html);

            $('#my_support_link').click( function() {
                $.pageslide({ href: '#modal', direction: "left", modal: true });
                $('#my_support_link').hide();

                payload = {
                    "username":    $(".loggedinusername").html(), 
                    "url":         document.URL,
                };

                support_submit( payload, "get_initial_data", initial_data );
            });

            $('#my_support_cancel').click( function() {
                $.pageslide.close();
                $('#my_support_link').show();
            });

            $('#my_support_startpage_submit').click( function() {
                if (typeof borrowernumber != 'undefined') {
                    borrower = borrowernumber;
                } else {
                    borrower = '';
                }
                payload = {
                    "url":         document.URL,
                    "referrer":    document.referrer,
                    "email":       $("#my_support_email").val(),
                    "name":        $("#my_support_name").val(),
                    "currentpage": $("#my_support_relates_to_current_page").val(),
                    "description": $("#my_support_description").val(),
                    "branchname":  $("#logged-in-branch-name").html(),
                    "branchcode":  $("#logged-in-branch-code").html(),
                    "username":    $(".loggedinusername").html(),
                    "borrower":    borrower,
                    "html":        $('html')[0].outerHTML
                }

                support_submit( payload, "process_support_request", final_data );
            });

            $('#my_support_submit').click( function() {
                if (typeof borrowernumber != 'undefined') {
                    borrower = borrowernumber;
                } else {
                    borrower = '';
                }
                payload.description = $("#my_support_description").val();

                support_submit( payload, "process_support_request", support_data_submitted );
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
}

function initial_data ( data ) {
    $('#startpage').show();
    $('#my_support_name').val(data.username);
    $('#my_support_email').val(data.user.email);
    $('#category').html(data.category);
    $('#page').html(data.page);
    console.log( 'initial_data() data.success : ' + data.success );
    console.log( 'initial_data() data.user.firstname : ' + data.user.firstname );
    console.log( 'initial_data() data.username : ' + data.username );
}

function final_data ( data ) {
    $('#finalpage').show();
}

