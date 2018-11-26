var HtmlParser = function (source, options) {
    var SELF_CLOSED_TAGS=['DOCTYPE', 'BR','WBR', 'HR', 'INPUT', 'IMG', 'META','TRACK','SOURCE','FRAME','AREA','LINK','EMBED', 'COL','BASEFONT','BASE'];

    var getTagInfo = function (source) {
        var openTagPattern = /<\s*[!]{0,1}\s*(?<tagname>\w+)[^>]*>/gim;
       // var commentPattern = '(?=<!--)([\s\S]*?)-->';
        var closeTagPattern = /<\s*\/\s*(?<tagname>\w+)\s*>/gim;

        var tag={Name: 'UNKNOWN', IsSelfClosed: false };
        var openTagMatch = openTagPattern.exec(source);
        if (openTagMatch != null && openTagMatch.length > 0) {
            tag.Name=openTagMatch.groups['tagname'].toUpperCase();
            tag.IsSelfClosed=SELF_CLOSED_TAGS.indexOf(tag.Name)>-1;
            tag.IsOpenTag=true;
            if(!tag.IsSelfClosed)
            {
                tag.IsSelfClosed=source.replace(' ','').endsWith('/>')
            }
            return tag;
        }
        else {
            var closeTagMatch = closeTagPattern.exec(source);
            if (closeTagMatch != null && closeTagMatch.length > 0) {
                return { Name: closeTagMatch.groups['tagname'].toUpperCase(),IsOpenTag:false, IsSelfClosed: false };
            }
        }
        return null;
    }
    var getNodes = function (source) {
        source = source.substring(source.indexOf('<'), source.lastIndexOf('>') + 1);
        var documentNode = { Name: 'DOCUMENT', Html: '', Type: 'START', Children: [], Parent: null };
        var inTag = false;
        var inComment = false;
        var node = '';
        var currentNode = documentNode;
        for (var i = 0; i < source.length; i++) {
            var cur = source.charAt(i);
            if (inComment) {
                node += cur;
                if (cur == '>' && source.charAt(i - 1) == '-' && source.charAt(i - 2) == '-') {
                    inComment = false;
                    if (node) {
                        currentNode.Children.push({ Name: 'COMMENT', Html: node, Children: [], Parent: currentNode });
                    }
                    node = '';
                }
            }
            else if (inTag) {
                node += cur;
                if (cur == '>') {
                    inTag = false;
                    if (node) {
                        var tag = getTagInfo(node);
                        if (tag) {
                            if (tag.IsOpenTag) {

                                if (tag.IsSelfClosed) {
                                    var newNode = { Name: tag.Name, Html: node, Type: 'SELF', Children: [], Parent: currentNode };
                                    currentNode.Children.push(newNode);
                                }
                                else {
                                    var newNode = { Name: tag.Name, Html: node, Type: 'OPEN', Children: [], Parent: currentNode };
                                    currentNode.Children.push(newNode);
                                    currentNode = newNode;
                                }
                            }
                            else {
                                currentNode.Children.push({ Name: tag.Name, Type: 'CLOSE', Html: node, Children: [], Parent: currentNode });
                                if(currentNode.Parent)
                                {
                                    currentNode = currentNode.Parent;
                                }
                            }
                        }
                        else {
                            currentNode.Children.push({ Name: 'UNKNOWN', Type: 'UNKNOWN', Html: node, Children: [], Parent: currentNode });
                        }
                    }
                    node = '';
                }
            }
            else {
                if (cur == '<') {
                    if (source.charAt(i + 1) == '!' && source.charAt(i + 2) == '-' && source.charAt(i + 3) == '-') {
                        inComment = true;
                    }
                    else {
                        inTag = true;
                    }
                    if (node) {
                        currentNode.Children.push({ Name: 'TEXT', Type: 'SELF', Html: node, Children: [], Parent: currentNode });
                    }
                    node = '';

                }
                node += cur;
            }
        }
        if (node) {
            var tag = findTag(node);
            if (tag) {
                if (tag.IsOpenTag) {

                    if (SELF_CLOSED_TAGS.indexOf(tag.Name) > -1) {
                        var newNode = { Name: tag.Name, Html: node, Type: 'SELF', Children: [], Parent: currentNode };
                        currentNode.Children.push(newNode);
                    }
                    else {
                        var newNode = { Name: tag.Name, Html: node, Type: 'OPEN', Children: [], Parent: currentNode };
                        currentNode.Children.push(newNode);
                        currentNode = newNode;
                    }
                }
                else {
                    currentNode.Children.push({ Name: tag.Name, Type: 'CLOSE', Html: node, Children: [], Parent: currentNode });
                    currentNode = currentNode.Parent;
                }
            }
            else {
                currentNode.Children.push({ Name: 'UNKNOWN', Type: 'UNKNOWN', Html: node, Children: [], Parent: currentNode });
            }
        }
        return documentNode;
    }

    var nodes= getNodes(source);
    
};
