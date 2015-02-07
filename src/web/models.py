import hashlib

from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    @property
    def avatar_url(self):
        gravatar_url = "http://www.gravatar.com/avatar/{}"
        hash = hashlib.md5(self.email.lower()).hexdigest()
        return gravatar_url.format(hash)

    @property
    def full_name(self):
        if self.first_name or self.last_name:
            return "{} {}".format(self.first_name, self.last_name)
        else:
            return "Unknown"