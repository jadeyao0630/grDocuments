<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ page import="com.landray.kmss.util.MD5Util,com.landray.kmss.util.UserUtil" %>
<%
	String loginName = UserUtil.getUser().getFdLoginName();
	String key = "G5xEcmNCRnJ3Cxv7VEh2Xw==";
	String type = request.getParameter("type");
	String path = "";
	if("1".equals(type)){ 
	}

	String url = "http://192.168.10.213:3000/login?user="+loginName+"&token="+key;
		request.setAttribute("url", url);
	
%>
<script>
	var url="${url}";
	if(url){
		window.location = url;
	}else{
		alert("进入异常，请联系管理员");
	}
</script>