import json
from django.http import HttpResponse
from django.shortcuts import render
from service import get_service_by_name


def index(request):
    return render(request, 'web/index.html')


def get_estimate(request, service, from_ll, to_ll):
    estimate = get_service_by_name(service).get_estimate(from_ll, to_ll)
    return HttpResponse(json.dumps(estimate))
