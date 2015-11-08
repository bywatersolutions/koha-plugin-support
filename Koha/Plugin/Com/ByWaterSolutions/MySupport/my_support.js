$.getScript('/plugin/Koha/Plugin/Com/ByWaterSolutions/MySupport/pageslide/jquery.pageslide.min.js', function() {
    $.get("/plugin/Koha/Plugin/Com/ByWaterSolutions/MySupport/pageslide/jquery.pageslide.css", function(css){
        $("<style></style>").appendTo("head").html(css);
        $.get("/plugin/Koha/Plugin/Com/ByWaterSolutions/MySupport/my_support.html", function(html){
            $('body').append(html);

            $('#my_support_link').click( function() {
                $.pageslide({ href: '#modal', direction: "left", modal: true });
                $('#my_support_link').hide();
            });

            $('#my_support_cancel').click( function() {
                $.pageslide.close();
                $('#my_support_link').show();
            });

            $('#my_support_submit').click( function() {
                if (typeof borrowernumber != 'undefined') {
                    borrower = borrowernumber;
                } else {
                    borrower = '';
                }
                data = {
                    "class":       "Koha::Plugin::Com::ByWaterSolutions::MySupport", 
                    "method":      "tool",
                    "sub":         "process_support_request",
                    "url":         document.URL,
                    "email":       $("#my_support_email").val(),
                    "name":        $("#my_support_name").val(),
                    "description": $("#my_support_description").val(),
                    "branchname":  $("#logged-in-branch-name").html(),
                    "branchcode":  $("#logged-in-branch-code").html(),
                    "username":    $(".loggedinusername").html(),
                    "borrower":    borrower,
                    "html":        $('html')[0].outerHTML
                };

                console.log( "Data: ", data );

                $.ajax({ 
                    type: "POST",
                    url: "/cgi-bin/koha/plugins/run.pl",
                    data: data,
                    success: support_data_submitted,
                    dataType: "json",
                });
            });

        });
    });
});

function support_data_submitted( data ) {
    if ( data.success ) {
        // Can we get the support email?
        // it would be nice to say
        // "Support request submitted to ..."
        alert("Support request submitted!");
    } else if ( data.error ) {
        alert("ERROR: " + data.error );
    }
}
