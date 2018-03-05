(function($){
  function enableComments() {
    if($('#disqus_script').length ) {
      return;
    }

    var dsq = document.createElement('script'); 
    dsq.type = 'text/javascript'; 
    dsq.async = true;
    dsq.id = 'disqus_script'

    var disqus_shortname = window.disqus_short_name;
    dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
  }

  function loadCountScript() {
    if($('#dsq-count-scr').length ) {
      return;
    }

    var dsq = document.createElement('script'); 
    dsq.type = 'text/javascript'; 
    dsq.async = true;
    dsq.id = 'dsq-count-scr'

    var disqus_shortname = window.disqus_short_name;
    dsq.src = '//' + disqus_shortname + '.disqus.com/count.js';
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
  }

  $(window).on('load', function() {
    let $comments_checkbox = $('#enable_comments');

    console.log(Cookies.get('enable_comments'), typeof(Cookies.get('enable_comments')));
    if(Cookies.get('enable_comments') == '1') {
      loadCountScript();
    }

    if($comments_checkbox.length) {
      if(Cookies.get('enable_comments') == '1') {
        $comments_checkbox.prop('checked', true);
        enableComments();
      }

      $comments_checkbox.change(function() {
        if(this.checked) {
          Cookies.set('enable_comments', '1');
          enableComments();
        } else {
          Cookies.remove('enable_comments');
        }
      });
    }
    
  });
})(jQuery);
